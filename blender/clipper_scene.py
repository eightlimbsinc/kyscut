"""
Photoreal clipper zoom for the KYS.CUTZ hero.

Builds a pro cordless clipper procedurally, lights it like a product shot and
renders a camera move that orbits the clipper and dives into the blade teeth.

Run (Blender as a Python module, `pip install bpy`):
    python blender/clipper_scene.py --out hero-video/public/clipper --frames 1-150 [--samples 32] [--scale 100]
"""
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="hero-video/public/clipper")
ap.add_argument("--frames", default="1-150")
ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--scale", type=int, default=100, help="resolution percentage of 1920x1080")
ap.add_argument("--save-blend", default="")
args = ap.parse_args(argv)

GOLD = (0.83, 0.62, 0.26, 1)

# ---------------------------------------------------------------- reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def add_mod(obj, kind, **kw):
    m = obj.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def mat_principled(name, color, metallic=0.0, roughness=0.5, coat=0.0, aniso=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if aniso:
        b.inputs["Anisotropic"].default_value = aniso
    return m


# ---------------------------------------------------------------- materials
m_body = mat_principled("Body", (0.0025, 0.0025, 0.003, 1), metallic=0.0, roughness=0.3, coat=0.0)
# Low specular so the soft key doesn't wash the black body out to gray.
m_body.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.18
# Knurled grip: fine voronoi bump on the lower body only.
nt = m_body.node_tree
bsdf = nt.nodes["Principled BSDF"]
tex = nt.nodes.new("ShaderNodeTexVoronoi")
tex.inputs["Scale"].default_value = 260.0
coord = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeMapRange")  # grip only below z≈0.75 (object space)
ramp.inputs["From Min"].default_value = 0.78
ramp.inputs["From Max"].default_value = 0.72
mult = nt.nodes.new("ShaderNodeMath")
mult.operation = "MULTIPLY"
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.35
bump.inputs["Distance"].default_value = 0.002
nt.links.new(coord.outputs["Object"], tex.inputs["Vector"])
nt.links.new(coord.outputs["Object"], sep.inputs["Vector"])
nt.links.new(sep.outputs["Z"], ramp.inputs["Value"])
nt.links.new(tex.outputs["Distance"], mult.inputs[0])
nt.links.new(ramp.outputs["Result"], mult.inputs[1])
nt.links.new(mult.outputs["Value"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

m_gold = mat_principled("Gold", GOLD, metallic=1.0, roughness=0.16, aniso=0.4)
m_chrome = mat_principled("Chrome", (0.92, 0.92, 0.93, 1), metallic=1.0, roughness=0.07)
m_steel = mat_principled("BrushedSteel", (0.75, 0.75, 0.77, 1), metallic=1.0, roughness=0.22, aniso=0.7)
m_floor = mat_principled("Floor", (0.006, 0.006, 0.006, 1), metallic=0.0, roughness=0.22)
m_led = bpy.data.materials.new("LED")
m_led.use_nodes = True
led = m_led.node_tree.nodes["Principled BSDF"]
led.inputs["Emission Color"].default_value = (1.0, 0.78, 0.4, 1)
led.inputs["Emission Strength"].default_value = 12.0

# ---------------------------------------------------------------- clipper body
bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=0.18, depth=1.2, location=(0, 0, 0.62))
body = bpy.context.object
body.name = "Body"
body.scale = (1.0, 0.76, 1.0)
bpy.ops.object.transform_apply(scale=True)
add_mod(body, "SIMPLE_DEFORM", deform_method="TAPER", factor=0.12, deform_axis="Z")
add_mod(body, "BEVEL", width=0.06, segments=8, limit_method="ANGLE")
add_mod(body, "SUBSURF", levels=2, render_levels=2)
smooth(body)
body.data.materials.append(m_body)

# Gold collar between body and head
bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=0.19, depth=0.05, location=(0, 0, 1.235))
collar = bpy.context.object
collar.scale = (1.0, 0.76, 1.0)
bpy.ops.object.transform_apply(scale=True)
add_mod(collar, "BEVEL", width=0.012, segments=4)
smooth(collar)
collar.data.materials.append(m_gold)

# Thin gold grip rings
for z in (0.22, 0.30, 0.38):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.183, minor_radius=0.006, major_segments=96, minor_segments=12, location=(0, 0, z))
    r = bpy.context.object
    r.scale = (1.0, 0.76, 1.0)
    smooth(r)
    r.data.materials.append(m_gold)

# Blade housing (head)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.31))
head = bpy.context.object
head.name = "Head"
head.scale = (0.46, 0.17, 0.11)
bpy.ops.object.transform_apply(scale=True)
add_mod(head, "BEVEL", width=0.03, segments=8)
smooth(head)
head.data.materials.append(m_steel)

# Gold cutting blade (front) + chrome stationary blade with teeth
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.045, 1.385))
cutter = bpy.context.object
cutter.scale = (0.44, 0.012, 0.06)
bpy.ops.object.transform_apply(scale=True)
add_mod(cutter, "BEVEL", width=0.003, segments=3)
cutter.data.materials.append(m_gold)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.025, 1.38))
plate = bpy.context.object
plate.scale = (0.47, 0.014, 0.07)
bpy.ops.object.transform_apply(scale=True)
add_mod(plate, "BEVEL", width=0.003, segments=3)
plate.data.materials.append(m_chrome)

TEETH = 34
span = 0.45


def build_teeth(name, blade_y, z0, h, w, depth, mat):
    """Real tooth geometry (no modifiers): tapered, rounded-tip teeth joined into one mesh."""
    import bmesh
    bm = bmesh.new()
    for i in range(TEETH):
        x = -span / 2 + i * span / (TEETH - 1)
        res = bmesh.ops.create_cube(bm, size=1.0)
        for v in res["verts"]:
            top = v.co.z > 0
            v.co.x = x + v.co.x * w * (0.45 if top else 1.0)
            v.co.y = blade_y + v.co.y * depth * (0.7 if top else 1.0)
            v.co.z = z0 + (v.co.z + 0.5) * h
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    add_mod(ob, "BEVEL", width=0.0012, segments=2)
    smooth(ob)
    ob.data.materials.append(mat)
    return ob


build_teeth("TeethChrome", -0.025, 1.41, 0.075, 0.0085, 0.014, m_chrome)
build_teeth("TeethGold", -0.045, 1.41, 0.048, 0.0072, 0.011, m_gold)

# Taper lever (gold) on the right side
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.035, depth=0.08, location=(0.205, 0, 1.15), rotation=(0, math.pi / 2, 0))
lever = bpy.context.object
add_mod(lever, "BEVEL", width=0.008, segments=4)
smooth(lever)
lever.data.materials.append(m_gold)

# Power button with glowing LED ring
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.035, depth=0.02, location=(0, -0.137, 0.95), rotation=(math.pi / 2, 0, 0))
btn = bpy.context.object
add_mod(btn, "BEVEL", width=0.006, segments=3)
smooth(btn)
btn.data.materials.append(m_chrome)
bpy.ops.mesh.primitive_torus_add(major_radius=0.042, minor_radius=0.004, location=(0, -0.136, 0.95), rotation=(math.pi / 2, 0, 0))
ring = bpy.context.object
ring.data.materials.append(m_led)

# Engraved wordmark running up the body
bpy.ops.object.text_add(location=(0.012, -0.172, 0.62), rotation=(math.pi / 2, 0, math.pi / 2 * 0))
txt = bpy.context.object
txt.data.body = "KYS.CUTZ"
txt.data.size = 0.075
txt.data.extrude = 0.003
txt.data.align_x = "CENTER"
txt.rotation_euler = (math.pi / 2, -math.pi / 2, 0)
txt.data.materials.append(m_gold)

# ---------------------------------------------------------------- studio
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0.0))
floor = bpy.context.object
floor.data.materials.append(m_floor)

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.004, 0.005, 1)


def area(name, loc, size, power, color, size_y=None):
    l = bpy.data.lights.new(name, "AREA")
    l.energy = power
    l.color = color[:3]
    if size_y:
        l.shape = "RECTANGLE"
        l.size = size
        l.size_y = size_y
    else:
        l.size = size
    o = bpy.data.objects.new(name, l)
    scene.collection.objects.link(o)
    o.location = loc
    d = Vector((0, 0, 0.9)) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o


area("Key", (-1.6, -1.8, 2.4), 1.8, 380, (1.0, 0.96, 0.9))
area("StripFront", (0.9, -1.4, 1.2), 0.15, 160, (1.0, 1.0, 1.0), size_y=2.2)
area("RimGold", (1.3, 1.3, 1.7), 1.0, 650, (1.0, 0.72, 0.35))
area("RimCool", (-1.4, 1.2, 1.1), 0.8, 260, (0.75, 0.85, 1.0))
area("Top", (0, 0, 3.0), 1.2, 120, (1.0, 1.0, 1.0))

# ---------------------------------------------------------------- camera move
target = bpy.data.objects.new("Target", None)
scene.collection.objects.link(target)
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50
cam_data.dof.use_dof = True
cam_data.dof.focus_object = target
cam_data.dof.aperture_fstop = 2.2
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
tc = cam.constraints.new("TRACK_TO")
tc.target = target
tc.track_axis = "TRACK_NEGATIVE_Z"
tc.up_axis = "UP_Y"

# (frame, camera location, look-at, lens, fstop)
KEYS = [
    (1, (-2.2, -4.6, 1.0), (0, 0, 0.78), 40, 5.6),
    (55, (1.3, -4.0, 1.25), (0, 0, 0.8), 40, 4.0),
    (100, (0.35, -1.5, 1.5), (0, -0.03, 1.38), 50, 2.8),
    (150, (0.0, -0.24, 1.47), (0, -0.03, 1.45), 60, 1.8),
]
for f, loc, look, lens, fstop in KEYS:
    cam.location = loc
    cam.keyframe_insert("location", frame=f)
    target.location = look
    target.keyframe_insert("location", frame=f)
    cam_data.lens = lens
    cam_data.keyframe_insert("lens", frame=f)
    cam_data.dof.aperture_fstop = fstop
    cam_data.dof.keyframe_insert("aperture_fstop", frame=f)

# Slow clockwise turn of the clipper itself for parallax in the reflections
clip_parts = [o for o in scene.objects if o.type in {"MESH", "FONT"} and o is not floor]
pivot = bpy.data.objects.new("Pivot", None)
scene.collection.objects.link(pivot)
for o in clip_parts:
    o.parent = pivot
pivot.rotation_euler = (0, 0, math.radians(-28))
pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", frame=110)

for ob in (cam, target, pivot):
    ad = ob.animation_data
    if ad and ad.action:
        for layer in getattr(ad.action, "layers", []):
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points:
                            kp.interpolation = "BEZIER"
                            kp.easing = "AUTO"

# ---------------------------------------------------------------- render settings
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = args.scale
scene.render.fps = 30
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 94
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"
except TypeError:
    pass

if args.save_blend:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.save_blend))

out = os.path.abspath(args.out)
os.makedirs(out, exist_ok=True)
start, _, end = args.frames.partition("-")
frames = range(int(start), int(end or start) + 1)
for f in frames:
    path = os.path.join(out, f"{f:04d}.jpg")
    if os.path.exists(path):
        continue  # resumable
    scene.frame_set(f)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"rendered {path}", flush=True)

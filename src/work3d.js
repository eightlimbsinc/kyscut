import * as THREE from 'three';

/**
 * Scroll-driven flight through a helix of real cuts.
 * Follows the UI/UX Pro Max three.js rules: single renderer, DPR cap 2, shared geometry,
 * one raycaster evaluated in the loop, cursor feedback, ResizeObserver, pause when hidden/offscreen.
 */
export function createWork3D({ canvas, cuts, onOpen, onActive }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0a09, 5, 20);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);

  const SPACING = 3.6;
  const RADIUS = 2.6;
  const cardGeo = new THREE.PlaneGeometry(2.25, 3.0);
  const frameGeo = new THREE.PlaneGeometry(2.33, 3.08);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xc9a24a, transparent: true, opacity: 0.55 });
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const cards = cuts.map((cut, i) => {
    const group = new THREE.Group();
    const angle = i * 2.15 + 0.6;
    group.position.set(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS * 0.55, -i * SPACING);
    group.lookAt(group.position.x * 0.35, group.position.y * 0.35, group.position.z + 8);

    const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    loader.load(cut.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      mat.map = tex;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    });
    const card = new THREE.Mesh(cardGeo, mat);
    card.userData.index = i;
    const border = new THREE.Mesh(frameGeo, frameMat);
    border.position.z = -0.01;
    group.add(border, card);
    group.userData = { card, hover: 0, baseY: group.position.y };
    scene.add(group);
    return group;
  });

  // Gold dust along the tunnel
  const DUST = window.matchMedia('(max-width: 640px)').matches ? 900 : 2200;
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = 6 - Math.random() * (cuts.length * SPACING + 12);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xe3c27a, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(dust);

  // State
  const startZ = 6;
  const endZ = -(cuts.length - 1) * SPACING + 2.5;
  let progress = 0;
  let camZ = startZ;
  const pointer = new THREE.Vector2(0, 0);
  const smoothPointer = new THREE.Vector2(0, 0);
  const ndc = new THREE.Vector2(9, 9);
  const raycaster = new THREE.Raycaster();
  const cardMeshes = cards.map((g) => g.userData.card);
  let hovered = null;
  let lastActive = -1;
  let visible = true;
  const timer = new THREE.Timer();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 70 : 55;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    pointer.copy(ndc);
  });
  canvas.addEventListener('pointerleave', () => ndc.set(9, 9));
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 8) return;
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(cardMeshes, false)[0];
    if (hit) onOpen(hit.object.userData.index);
  });

  function frame(t) {
    timer.update(t);
    const dt = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();

    camZ += (startZ + (endZ - startZ) * progress - camZ) * Math.min(1, dt * 6);
    smoothPointer.lerp(pointer, Math.min(1, dt * 3));
    camera.position.set(smoothPointer.x * 0.6, smoothPointer.y * 0.4, camZ);
    camera.lookAt(smoothPointer.x * 0.2, smoothPointer.y * 0.15, camZ - 6);
    camera.rotation.z = Math.sin(progress * Math.PI * 2) * 0.06;

    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(cardMeshes, false)[0];
    const next = hit ? hit.object.parent : null;
    if (next !== hovered) {
      hovered = next;
      canvas.style.cursor = hovered ? 'pointer' : '';
    }

    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const g = cards[i];
      const ud = g.userData;
      ud.hover += ((g === hovered ? 1 : 0) - ud.hover) * Math.min(1, dt * 8);
      const s = 1 + ud.hover * 0.08;
      g.scale.setScalar(s);
      g.position.y = ud.baseY + Math.sin(time * 0.8 + i) * 0.08;
      const d = g.position.z - (camZ - 4);
      if (Math.abs(d) < best) {
        best = Math.abs(d);
        nearest = i;
      }
    }
    if (nearest !== lastActive) {
      lastActive = nearest;
      onActive(nearest);
    }
    dust.rotation.z = time * 0.02;
    renderer.render(scene, camera);
  }

  function run(on) {
    renderer.setAnimationLoop(on ? frame : null);
  }
  run(true);

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run(visible && !document.hidden);
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => run(visible && !document.hidden));

  return {
    setProgress(p) {
      progress = p;
    },
  };
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

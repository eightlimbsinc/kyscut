import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Photoreal clipper rendered in Blender/Cycles (see blender/clipper_scene.py), one JPEG per frame.
export const CLIPPER_FRAMES = 150;
const pad = (n: number) => String(n).padStart(4, "0");

export const BlenderClipper: React.FC = () => {
  const frame = useCurrentFrame();
  const f = Math.min(CLIPPER_FRAMES, frame + 1);
  // Motor "switches on" as the camera reaches the blade: micro-shake.
  const shake = frame > 95 ? (random(`sh${frame}`) - 0.5) * interpolate(frame, [95, 120], [0, 6], { extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img
        name="Clipper render"
        src={staticFile(`clipper/${pad(f)}.jpg`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          translate: `${shake}px ${shake * 0.6}px`,
        }}
      />
      {/* Light sweep across the lens as the blade fills frame */}
      <AbsoluteFill
        name="Lens sweep"
        style={{
          background: "linear-gradient(105deg, transparent 35%, rgba(255,226,160,0.35) 50%, transparent 65%)",
          translate: interpolate(frame, [118, 146], ["-100% 0%", "100% 0%"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          }),
          mixBlendMode: "screen",
        }}
      />
      {/* Dip to black at the end; the site then fades back up to the opening frame */}
      <AbsoluteFill
        name="Loop dip"
        style={{
          backgroundColor: "#000",
          opacity: interpolate(frame, [CLIPPER_FRAMES - 14, CLIPPER_FRAMES - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 1, 0.68, 1),
          }),
        }}
      />
    </AbsoluteFill>
  );
};

import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Photoreal clipper rendered in Blender/Cycles (see blender/clipper_scene.py), one JPEG per frame.
export const CLIPPER_FRAMES = 150;
const pad = (n: number) => String(n).padStart(4, "0");

const GoldDust: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {new Array(70).fill(0).map((_, i) => {
        const x = random(`dx${i}`) * width;
        const speed = 0.4 + random(`ds${i}`) * 1.2;
        const y = (random(`dy${i}`) * height - frame * speed + height * 4) % height;
        const size = 1.5 + random(`dz${i}`) * 3.5;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.08 + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: "#e8c77e",
              boxShadow: `0 0 ${size * 4}px #c9a24a`,
              opacity: twinkle * 0.7,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

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
      <GoldDust />
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
      {/* Flash out into the next scene */}
      <AbsoluteFill
        name="Flash"
        style={{
          backgroundColor: "#fff3d6",
          opacity: interpolate(frame, [140, CLIPPER_FRAMES], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
    </AbsoluteFill>
  );
};

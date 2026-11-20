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

// Real fades from @kys.cutz. Each card flies in from deep space and locks into a tilted gallery wall.
const CUTS = [
  "cut-01", "cut-02", "cut-03", "cut-04", "cut-05", "cut-06",
  "cut-07", "cut-08", "cut-09", "cut-10", "cut-11", "cut-12",
];
const COLS = 6;
const CARD_W = 300;
const CARD_H = 400;
const GAP = 28;
const STAGGER = 5;
const FLIGHT = 26;

export const MONTAGE_LENGTH = 5 * 30;

// Hero order: start from the centre of the wall and spiral outwards so the eye stays centred.
const ORDER = [2, 3, 8, 9, 1, 4, 7, 10, 0, 5, 6, 11];

const Card: React.FC<{ src: string; slot: number; delay: number }> = ({ src, slot, delay }) => {
  const frame = useCurrentFrame();
  const col = slot % COLS;
  const row = Math.floor(slot / COLS);
  const x = (col - (COLS - 1) / 2) * (CARD_W + GAP);
  const y = (row - 0.5) * (CARD_H + GAP);

  const t = interpolate(frame, [delay, delay + FLIGHT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // Start position: far behind the camera's focal plane, scattered, spinning.
  const sx = (random(`fx${slot}`) - 0.5) * 2400;
  const sy = (random(`fy${slot}`) - 0.5) * 1400;
  const sz = -3200 - random(`fz${slot}`) * 1200;
  const spin = (random(`fr${slot}`) - 0.5) * 140;

  const glint = interpolate(frame, [delay + FLIGHT - 6, delay + FLIGHT + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: -CARD_W / 2,
        top: -CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transformStyle: "preserve-3d",
        transform: `translate3d(${sx + (x - sx) * t}px, ${sy + (y - sy) * t}px, ${sz * (1 - t)}px) rotateY(${spin * (1 - t)}deg) rotateZ(${spin * 0.3 * (1 - t)}deg)`,
        opacity: interpolate(t, [0, 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.65)",
        outline: "1px solid rgba(201,162,74,0.35)",
      }}
    >
      <Img src={staticFile(`work/${src}.webp`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Gold light sweep as the card lands */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(115deg, transparent 30%, rgba(255,230,170,0.55) 50%, transparent 70%)",
          translate: `${interpolate(glint, [0, 1], [-120, 120])}% 0%`,
          opacity: glint > 0 && glint < 1 ? 1 : 0,
        }}
      />
    </div>
  );
};

export const WorkMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // The wall itself drifts and dollies so the shot never sits still.
  const rotY = interpolate(frame, [0, MONTAGE_LENGTH], [-18, -8], { extrapolateRight: "clamp" });
  const rotX = interpolate(frame, [0, MONTAGE_LENGTH], [10, 6], { extrapolateRight: "clamp" });
  const z = interpolate(frame, [0, MONTAGE_LENGTH], [-820, -560], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });

  return (
    <AbsoluteFill
      name="Fly-in wall"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #2a2117 0%, #0b0a09 70%)",
        perspective: 1400,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2,
          transformStyle: "preserve-3d",
          transform: `translateZ(${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {ORDER.map((slot, i) => (
          <Card key={slot} src={CUTS[slot]} slot={slot} delay={4 + i * STAGGER} />
        ))}
      </div>
      {/* Vignette for headline legibility on the site */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

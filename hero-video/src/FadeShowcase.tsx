import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./font";

// His real skin fade, revealed out of the flash with a guard scale tracing the blend.
export const FADE_SHOWCASE_LENGTH = 105;
const GOLD = "#c9a24a";

const GUARDS = [
  { label: "0", y: 82 },
  { label: "½", y: 72 },
  { label: "1", y: 61 },
  { label: "2", y: 49 },
  { label: "3", y: 37 },
];

export const FadeShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a09", overflow: "hidden" }}>
      <Img
        name="Backdrop"
        src={staticFile("work/cut-01.webp")}
        style={{
          position: "absolute",
          inset: -80,
          width: "calc(100% + 160px)",
          height: "calc(100% + 160px)",
          objectFit: "cover",
          filter: "blur(48px) brightness(0.35)",
        }}
      />
      <Interactive.Div
        name="Photo frame"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          height: 940,
          aspectRatio: "564 / 754",
          translate: "-50% -50%",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 50px 140px rgba(0,0,0,0.7)",
          outline: "1px solid rgba(201,162,74,0.4)",
          scale: interpolate(frame, [0, FADE_SHOWCASE_LENGTH], [1.25, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
            output: "perceptual-scale",
          }),
        }}
      >
        <Img name="Skin fade" src={staticFile("work/cut-01.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Interactive.Div>

      {/* Guard scale */}
      <div style={{ position: "absolute", left: "calc(50% + 380px)", top: 0, bottom: 0, width: 300 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "36%",
            width: 2,
            height: "47%",
            backgroundColor: GOLD,
            transformOrigin: "bottom",
            scale: `1 ${interpolate(frame, [18, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}`,
          }}
        />
        {GUARDS.map((g, i) => (
          <Interactive.Div
            key={g.label}
            name="Guard"
            style={{
              position: "absolute",
              left: -8,
              top: `${g.y}%`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily,
              fontWeight: 800,
              fontSize: 44,
              color: "#f5efe4",
              opacity: interpolate(frame, [24 + i * 7, 36 + i * 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [24 + i * 7, 36 + i * 7], ["-20px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: GOLD, boxShadow: "0 0 18px #c9a24a" }} />
            {g.label}
          </Interactive.Div>
        ))}
      </div>

      {/* Flash in from the clipper scene */}
      <AbsoluteFill
        style={{
          backgroundColor: "#fff3d6",
          opacity: interpolate(frame, [0, 14], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};

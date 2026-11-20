import { AbsoluteFill, Composition, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BlenderClipper, CLIPPER_FRAMES } from "./BlenderClipper";
import { FADE_SHOWCASE_LENGTH, FadeShowcase } from "./FadeShowcase";
import { MONTAGE_LENGTH, WorkMontage } from "./WorkMontage";

const FPS = 30;
const CLIPPER = { from: 0, duration: CLIPPER_FRAMES };
const FADE = { from: CLIPPER.duration, duration: FADE_SHOWCASE_LENGTH };
const MONTAGE = { from: FADE.from + FADE.duration - 10, duration: MONTAGE_LENGTH };
const OUTRO = 20;
const TOTAL = MONTAGE.from + MONTAGE.duration;

const CrossIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(frame, [0, frames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        }),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Hero reel: photoreal Blender clipper dives into the blade → his real skin fade with guard scale → his cuts fly into a wall.
export const HeroReel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a09" }}>
      <Sequence name="Clipper (Blender)" from={CLIPPER.from} durationInFrames={CLIPPER.duration}>
        <BlenderClipper />
      </Sequence>
      <Sequence name="Real fade" from={FADE.from} durationInFrames={FADE.duration}>
        <FadeShowcase />
      </Sequence>
      <Sequence name="Work fly-in" from={MONTAGE.from} durationInFrames={MONTAGE.duration}>
        <CrossIn frames={10}>
          <WorkMontage />
        </CrossIn>
      </Sequence>
      {/* Dip to black so the website's looping video restarts cleanly */}
      <AbsoluteFill
        name="Outro dip"
        style={{
          backgroundColor: "#000",
          opacity: interpolate(frame, [TOTAL - OUTRO, TOTAL - 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <>
      <Composition id="HeroReel" component={HeroReel} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
      <Composition id="HeroPoster" component={WorkMontage} durationInFrames={MONTAGE_LENGTH} fps={FPS} width={1920} height={1080} />
    </>
  );
};

import { Composition } from "remotion";
import { BlenderClipper, CLIPPER_FRAMES } from "./BlenderClipper";

// Hero reel: photoreal Blender clipper turns, then the camera dives into the blade teeth. Loops via a dip to black.
export const MyComposition = () => {
  return (
    <Composition id="HeroReel" component={BlenderClipper} durationInFrames={CLIPPER_FRAMES} fps={30} width={1920} height={1080} />
  );
};

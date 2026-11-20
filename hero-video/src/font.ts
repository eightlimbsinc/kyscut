import { continueRender, delayRender, staticFile } from "remotion";

// Syne is bundled locally so renders never depend on a network font fetch.
export const fontFamily = "Syne";

if (typeof document !== "undefined") {
  const handle = delayRender("Loading Syne");
  const face = new FontFace(fontFamily, `url(${staticFile("fonts/Syne-800.ttf")}) format("truetype")`, { weight: "800" });
  face
    .load()
    .then((f) => {
      document.fonts.add(f);
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}

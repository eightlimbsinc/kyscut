// All site content in one place. Style names are best guesses from the photos — edit freely.
// Images live in /public/work. Replace with full-resolution originals any time (keep the file names).

export const CUTS = [
  { src: 'work/cut-01.webp', style: 'Skin fade', alt: 'Back view of a skin fade blended from the neckline up' },
  { src: 'work/cut-02.webp', style: 'Mid fade, textured top', alt: 'Mid fade with a textured fringe, side profile' },
  { src: 'work/cut-03.webp', style: 'Low taper, slick back', alt: 'Low taper with slicked-back hair, side profile' },
  { src: 'work/cut-04.webp', style: 'Burst fade fringe', alt: 'Burst fade with a long textured fringe' },
  { src: 'work/cut-05.webp', style: 'Crop + skin fade', alt: 'Short crop with a high skin fade' },
  { src: 'work/cut-06.webp', style: 'Bald fade + line-up', alt: 'Bald fade with a sharp line-up on short curls' },
  { src: 'work/cut-07.webp', style: 'Low taper curls', alt: 'Low taper keeping curly length on top' },
  { src: 'work/cut-08.webp', style: 'High skin fade', alt: 'High skin fade with short spiky top' },
  { src: 'work/cut-09.webp', style: 'Low fade', alt: 'Low fade with a natural side part' },
  { src: 'work/cut-10.webp', style: 'Low taper crop', alt: 'Low taper crop with a straight fringe' },
  { src: 'work/cut-11.webp', style: 'Drop fade', alt: 'Drop fade following the curve behind the ear' },
  { src: 'work/cut-12.webp', style: 'Freestyle design', alt: 'Skin fade with a freehand razor design' },
];

// Fade styles: `start`/`end` are where the blend sits on the head (0 = neckline, 1 = crown) for the animated bar.
export const FADES = [
  { name: 'Skin fade', note: 'Down to the skin, blended up seamless.', start: 0.05, end: 0.55, example: 0 },
  { name: 'Low fade', note: 'Starts just above the ear. Clean, office-safe.', start: 0.1, end: 0.35, example: 8 },
  { name: 'Mid fade', note: 'Sits at the temple. The everyday sweet spot.', start: 0.25, end: 0.55, example: 1 },
  { name: 'High fade', note: 'Taken up past the temple for max contrast.', start: 0.4, end: 0.8, example: 7 },
  { name: 'Taper', note: 'Just the sideburns and neckline, kept natural.', start: 0.02, end: 0.2, example: 9 },
  { name: 'Burst & drop', note: 'Curves around the ear or drops behind it.', start: 0.15, end: 0.5, example: 10 },
];

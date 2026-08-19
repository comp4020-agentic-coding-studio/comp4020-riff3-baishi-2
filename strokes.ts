// The data and logic behind the one interaction on this page: reveal an ink
// shrimp one brushstroke at a time and watch where recognition lives. Kept
// separate from main.ts (which only touches the DOM) so the interaction's
// actual contract — how many strokes, and which phase a count falls in — is a
// plain function spec/assignment-1.test.ts can call directly.
//
// The stroke order follows the real nine-stage sequence a Qi Baishi shrimp is
// built in: pale body wash, eyes and head ink, segment/tail outline, dark
// antennae, pale walking legs, dark angular pincers, fine leg/whisker detail,
// a second ink pass, then a last overall adjustment.

export type StrokeShape =
  | { kind: "path"; d: string }
  | { kind: "circle"; cx: number; cy: number; r: number };

export interface Stroke {
  id: string;
  shape: StrokeShape;
  width: number;
  // Circle fill, wash fill (when filled is true), or — for an unfilled line
  // stroke — an override for the line colour itself (used once, to punch a
  // paper-coloured highlight back through the ink).
  fill?: string;
  // True for a solid ink-wash shape (fill, no visible outline) rather than a
  // brush line (stroked, no fill) — the body wash and the two ink-block
  // passes are washes; everything else is a line.
  filled?: boolean;
  // Pale ("淡墨") strokes are drawn at reduced opacity rather than a lighter
  // colour, so they still read as the same ink under the same light.
  strokeOpacity?: number;
  // Offsets the whole stroke a few px, for strokes that need to sit just
  // off the shape they're layered against rather than exactly on top of it.
  offset?: { dx: number; dy: number };
}

const INK = "#141414";
const PAPER = "#fbf8ef";

// Ordered stage by stage, following the reference: 1 body wash, 2 eyes +
// head ink, 3 segments + tail, 4 antennae, 5 legs, 6 pincers, 7 fine detail,
// 8 ink adjustment, 9 final touch.
export const STROKES: Stroke[] = [
  // -- 1. 淡墨画虾身: pale body wash, darkest through the middle --
  {
    id: "body-wash",
    shape: {
      kind: "path",
      d: "M 480,88 C 408,110 355,163 283,190 C 215,215 152,192 124,140 L 120,156 C 158,218 225,245 297,220 C 365,197 412,140 480,112 Z",
    },
    width: 0,
    fill: "url(#bodyInk)",
    filled: true,
  },
  // -- 2. 点画眼睛，留出高光；画头胸部的墨块 --
  // The eyes sit forward on the snout tip, ahead of the head-thorax block
  // behind them, so the block's ink never covers the highlight gap between
  // the two dots.
  {
    id: "eye-left",
    shape: { kind: "circle", cx: 480, cy: 90, r: 3.2 },
    width: 0,
    fill: INK,
  },
  {
    id: "eye-right",
    shape: { kind: "circle", cx: 489, cy: 84, r: 3.2 },
    width: 0,
    fill: INK,
  },
  {
    id: "head-thorax-block",
    shape: {
      kind: "path",
      d: "M 415,102 C 425,86 452,80 472,90 C 486,97 486,110 472,118 C 452,128 422,122 412,110 C 408,106 410,104 415,102 Z",
    },
    width: 0,
    fill: INK,
    filled: true,
  },
  // -- 3. 用淡墨勾画腹部的节和尾部的形状 --
  // Each divider spans the full width of the body (not a tick off to one
  // side) — that's what makes the wash read as a jointed abdomen rather than
  // a plain tapered blob.
  {
    id: "segment-line-1",
    shape: { kind: "path", d: "M 388,128 Q 395,150 388,172" },
    width: 3,
    strokeOpacity: 0.55,
  },
  {
    id: "segment-line-2",
    shape: { kind: "path", d: "M 305,180 Q 312,200 305,220" },
    width: 3,
    strokeOpacity: 0.55,
  },
  {
    id: "segment-line-3",
    shape: { kind: "path", d: "M 225,210 Q 232,230 225,248" },
    width: 3,
    strokeOpacity: 0.55,
  },
  // The fan opens from the body's actual tail tip (~124,152) rather than
  // floating off to one side, so it reads as the tail flicking open rather
  // than a stray tuft of hay.
  {
    id: "tail-shape",
    shape: {
      kind: "path",
      d: "M 128,148 C 100,110 70,80 45,55 M 126,152 C 95,128 65,110 40,95 M 124,158 C 92,148 62,145 38,140 M 122,164 C 90,168 62,178 42,185",
    },
    width: 2.5,
    strokeOpacity: 0.6,
  },
  // -- 4. 浓墨画触角: two long dark whiskers, arcing outward --
  // The second whisker runs nearly straight down, well clear of where the
  // pincers reach forward, so the two pairs of dark lines don't tangle.
  {
    id: "antenna-1",
    shape: { kind: "path", d: "M 488,85 C 525,55 575,24 622,5" },
    width: 2.5,
  },
  {
    id: "antenna-2",
    shape: { kind: "path", d: "M 483,100 C 495,150 500,205 495,255" },
    width: 2.5,
  },
  // -- 5. 画步足: pale walking legs, varied length, crossing, angle --
  {
    id: "walking-legs",
    shape: {
      kind: "path",
      d: "M 270,200 L 260,222 M 245,208 L 236,229 M 220,213 L 211,233 M 195,213 L 187,231 M 170,205 L 163,223",
    },
    width: 2.5,
    strokeOpacity: 0.55,
  },
  // -- 6. 画钳（胸足）: dark angular pincers, folded joints --
  // Each pincer reaches forward from the head at a shallow angle — the
  // classic shrimp posture — ending in a small open hook, and stays clear of
  // antenna-2's now-vertical drop.
  {
    id: "pincer-upper",
    shape: {
      kind: "path",
      d: "M 494,100 C 525,98 555,110 575,135 C 582,144 578,152 568,148 M 575,135 L 592,140",
    },
    width: 3.2,
  },
  {
    id: "pincer-lower",
    shape: {
      kind: "path",
      d: "M 500,112 C 528,120 552,142 562,170 C 566,180 560,186 552,180 M 562,170 L 578,188",
    },
    width: 3.2,
  },
  // -- 7. 补画细足和须的穿插: fine legs and whisker interweaving --
  {
    id: "fine-legs",
    shape: {
      kind: "path",
      d: "M 350,175 L 342,194 M 325,185 L 317,204 M 300,196 L 292,214",
    },
    width: 1.8,
  },
  {
    id: "whisker-detail",
    shape: {
      kind: "path",
      d: "M 520,55 L 528,45 M 546,39 L 554,29 M 573,23 L 581,13",
    },
    width: 1.5,
  },
  // -- 8. 调整墨色: darken the head/thorax again, keep the segments open --
  {
    id: "ink-deepen-head",
    shape: {
      kind: "path",
      d: "M 420,104 C 428,92 450,87 466,95 C 477,101 477,110 467,116 C 450,124 428,120 418,110 C 415,108 417,106 420,104 Z",
    },
    width: 0,
    fill: INK,
    filled: true,
  },
  {
    id: "segment-highlight",
    shape: {
      kind: "path",
      d: "M 388,135 L 387,165 M 305,185 L 304,215 M 225,215 L 224,245",
    },
    width: 5,
    fill: PAPER,
  },
  // -- 9. 整体调整: last whiskers and legs settle into place --
  {
    id: "final-touch",
    shape: {
      kind: "path",
      d: "M 130,150 C 105,135 78,128 52,128 M 500,90 C 515,96 528,109 535,123",
    },
    width: 1.8,
  },
];

export type Phase = "unlike" | "sweet-spot" | "too-like";

// Below this many strokes, it's a wash, eyes, segments and a tail curl —
// evocative brushwork, but nothing has committed to being a shrimp until the
// antennae and legs both land.
export const UNLIKE_MAX = 10;
// Through this many, it's alive and unmistakable — legs, pincers, antennae,
// nothing more. Above it, every last leg and whisker gets accounted for.
export const SWEET_SPOT_MAX = 13;

export function phaseFor(count: number, total: number = STROKES.length): Phase {
  const clamped = Math.max(0, Math.min(count, total));
  if (clamped <= UNLIKE_MAX) return "unlike";
  if (clamped <= SWEET_SPOT_MAX) return "sweet-spot";
  return "too-like";
}

export function labelFor(phase: Phase): string {
  switch (phase) {
    case "unlike":
      return "不似 — too few marks. Nothing here has committed to being a shrimp yet.";
    case "sweet-spot":
      return "妙在似与不似之间 — the marvel, between likeness and unlikeness.";
    case "too-like":
      return "太似 — every leg accounted for, and the life has gone out of it.";
  }
}

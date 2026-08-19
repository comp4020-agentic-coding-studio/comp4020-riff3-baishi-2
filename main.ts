import { labelFor, phaseFor, STROKES, SWEET_SPOT_MAX, UNLIKE_MAX } from "./strokes";

const SVG_NS = "http://www.w3.org/2000/svg";

const canvas = document.querySelector<SVGSVGElement>("#shrimp-canvas");
const slider = document.querySelector<HTMLInputElement>("#stroke-slider");
const countLabel = document.querySelector<HTMLElement>("#stroke-count");
const phaseLabel = document.querySelector<HTMLElement>("#phase-label");
const markButton = document.querySelector<HTMLButtonElement>("#mark-button");
const markStatus = document.querySelector<HTMLElement>("#mark-status");
const comparison = document.querySelector<HTMLElement>("#comparison");
const comparisonText = document.querySelector<HTMLElement>("#comparison-text");

if (canvas && slider && countLabel && phaseLabel && markButton && markStatus && comparison && comparisonText) {
  // The body wash (stage 1) is drawn darkest through the middle, lighter at
  // the head and tail — a single filled shape can't fake that gradient with
  // a flat fill, so it references this gradient instead of currentColor.
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML =
    '<linearGradient id="bodyInk" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#141414" stop-opacity="0.55" />' +
    '<stop offset="45%" stop-color="#141414" stop-opacity="0.9" />' +
    '<stop offset="100%" stop-color="#141414" stop-opacity="0.28" />' +
    "</linearGradient>";
  canvas.appendChild(defs);

  const elements = STROKES.map((stroke) => {
    const el = document.createElementNS(
      SVG_NS,
      stroke.shape.kind === "circle" ? "circle" : "path",
    );
    if (stroke.shape.kind === "circle") {
      el.setAttribute("cx", String(stroke.shape.cx));
      el.setAttribute("cy", String(stroke.shape.cy));
      el.setAttribute("r", String(stroke.shape.r));
      el.setAttribute("fill", stroke.fill ?? "currentColor");
    } else if (stroke.filled) {
      el.setAttribute("d", stroke.shape.d);
      el.setAttribute("fill", stroke.fill ?? "currentColor");
      el.setAttribute("stroke", "none");
    } else {
      el.setAttribute("d", stroke.shape.d);
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", stroke.fill ?? "currentColor");
      el.setAttribute("stroke-width", String(stroke.width));
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("stroke-linejoin", "round");
      if (stroke.strokeOpacity !== undefined) {
        el.setAttribute("stroke-opacity", String(stroke.strokeOpacity));
      }
    }
    el.dataset.strokeId = stroke.id;
    if (stroke.offset) {
      el.setAttribute("transform", `translate(${stroke.offset.dx}, ${stroke.offset.dy})`);
    }
    canvas.appendChild(el);
    return el;
  });

  slider.max = String(STROKES.length);

  const render = (count: number) => {
    elements.forEach((el, index) => {
      el.style.opacity = index < count ? "1" : "0";
    });
    countLabel.textContent = `${count} / ${STROKES.length}`;
    const phase = phaseFor(count, STROKES.length);
    phaseLabel.textContent = labelFor(phase);
    phaseLabel.dataset.phase = phase;
    canvas.dataset.visibleCount = String(count);
  };

  slider.addEventListener("input", () => {
    render(Number(slider.value));
  });

  render(Number(slider.value));

  // The essay's own claim is that where a scribble becomes a shrimp, and
  // where it stops being one, is a judgement the visitor makes by looking —
  // not a fact anyone hands them. So let them make it, twice, then show how
  // their two marks sit against the cut baishi's own edit made.
  const BAISHI_BECOMES = UNLIKE_MAX + 1;
  const BAISHI_STOPS = SWEET_SPOT_MAX + 1;

  type MarkStage = "awaiting-becomes" | "awaiting-stops" | "done";
  let stage: MarkStage = "awaiting-becomes";
  let yourBecomes = 0;
  let yourStops = 0;

  const percentOf = (count: number) => `${(count / STROKES.length) * 100}%`;

  const placeTick = (id: string, count: number) => {
    const tick = document.querySelector<HTMLElement>(`#${id}`);
    if (tick) tick.style.left = percentOf(count);
  };

  const revealComparison = () => {
    const becomesGap = yourBecomes - BAISHI_BECOMES;
    const stopsGap = yourStops - BAISHI_STOPS;
    const describe = (gap: number) =>
      gap === 0 ? "exactly where baishi's own cut fell" : `${Math.abs(gap)} stroke${Math.abs(gap) === 1 ? "" : "s"} ${gap > 0 ? "later" : "earlier"} than baishi's own cut`;

    comparisonText.textContent =
      `You called it a shrimp at ${yourBecomes} strokes — ${describe(becomesGap)}. ` +
      `You called it over-explained at ${yourStops} strokes — ${describe(stopsGap)}.`;

    placeTick("tick-yours-becomes", yourBecomes);
    placeTick("tick-yours-stops", yourStops);
    placeTick("tick-baishi-becomes", BAISHI_BECOMES);
    placeTick("tick-baishi-stops", BAISHI_STOPS);
    comparison.hidden = false;
  };

  markButton.addEventListener("click", () => {
    const count = Number(slider.value);
    if (stage === "awaiting-becomes") {
      yourBecomes = count;
      stage = "awaiting-stops";
      markButton.textContent = "Mark: it stopped being one";
      markStatus.textContent = `Marked ${count} strokes as where it became a shrimp for you. Keep dragging, then mark where it stops being one.`;
    } else if (stage === "awaiting-stops") {
      yourStops = count;
      stage = "done";
      markButton.textContent = "Reset and try again";
      markStatus.textContent = `Marked ${count} strokes as where it stopped being a shrimp for you.`;
      revealComparison();
    } else {
      stage = "awaiting-becomes";
      markButton.textContent = "Mark: it just became a shrimp";
      markStatus.textContent = "";
      comparison.hidden = true;
    }
  });
}

// DOM wiring for the timeline. The scale, eras and lane packing live in
// timeline.ts as a pure model; the civilisation facts live in the dataset. This
// file turns scroll position into the live year readout, reveals bars as they
// enter view, and fills the detail popup on demand.
import { CIVILISATIONS } from "../data/civilisations";
import { eraFor, formatYear, TIMELINE_HEIGHT, yToYear } from "./timeline";

const $ = <T extends HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

const timelineEl = $("#timeline");
const yearReadout = $("#year-readout");
const eraReadout = $("#era-readout");
const progressEl = $("#timeline-progress");
const progressFill = $<HTMLElement>(".hud-progress-fill");

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

const reduceMotion =
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// --- live year readout --------------------------------------------------
if (timelineEl && yearReadout) {
  const readAt = (): { year: number; progress: number } => {
    const top = timelineEl.offsetTop;
    const docY = window.scrollY + window.innerHeight / 2;
    const into = clamp(docY - top, 0, TIMELINE_HEIGHT);
    return { year: yToYear(into), progress: into / TIMELINE_HEIGHT };
  };

  const paint = (): void => {
    const { year, progress } = readAt();
    const rounded = Math.round(year) || 1; // there is no year zero
    yearReadout.textContent = formatYear(rounded);
    if (eraReadout) eraReadout.textContent = eraFor(rounded);
    if (progressFill) progressFill.style.transform = `scaleX(${progress})`;
    progressEl?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  };

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      paint();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", paint);
  paint();
}

// --- reveal bars and marks as they scroll into view ---------------------
const revealable = document.querySelectorAll<HTMLElement>(".civ, .era-mark, .outro");
if (reduceMotion || !("IntersectionObserver" in window)) {
  for (const el of revealable) el.classList.add("in-view");
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of revealable) observer.observe(el);
}

// --- detail popup -------------------------------------------------------
const popup = $("#popup");
if (popup) {
  const byId = new Map(CIVILISATIONS.map((c) => [c.id, c]));
  const titleEl = $("#popup-title");
  const regionEl = $("#popup-region");
  const rangeEl = $("#popup-range");
  const blurbEl = $("#popup-blurb");
  const eventsEl = $<HTMLOListElement>("#popup-events");
  let opener: HTMLElement | null = null;

  const openCiv = (id: string, trigger: HTMLElement): void => {
    const civ = byId.get(id);
    if (!civ) return;
    if (titleEl) titleEl.textContent = civ.name;
    if (regionEl) regionEl.textContent = civ.region;
    if (rangeEl) rangeEl.textContent = `${formatYear(civ.start)} to ${formatYear(civ.end)}`;
    if (blurbEl) blurbEl.textContent = civ.blurb;
    if (eventsEl) {
      eventsEl.replaceChildren();
      for (const e of civ.events ?? []) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="popup-event-year">${formatYear(e.year)}</span> ${e.text}`;
        eventsEl.appendChild(li);
      }
    }
    opener = trigger;
    popup.hidden = false;
    popup.querySelector<HTMLButtonElement>(".popup-close")?.focus();
  };

  const close = (): void => {
    popup.hidden = true;
    opener?.focus();
    opener = null;
  };

  for (const btn of document.querySelectorAll<HTMLButtonElement>(".civ[data-civ]")) {
    btn.addEventListener("click", () => openCiv(btn.dataset.civ ?? "", btn));
  }
  for (const el of popup.querySelectorAll<HTMLElement>("[data-close]")) {
    el.addEventListener("click", close);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popup.hidden) close();
  });
}

export {};

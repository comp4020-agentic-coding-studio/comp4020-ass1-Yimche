// DOM wiring for the timeline. The scale, eras and lane packing live in
// timeline.ts as a pure model; the civilisation facts live in the dataset. This
// file turns scroll position into the live year readout, reveals bars as they
// enter view, and fills the detail popup on demand.
import { CIVILISATIONS, type RelationKind } from "../data/civilisations";
import { connectorPath, relationsOf, type ResolvedRelation } from "./geo";
import { eraFor, formatYear, TIMELINE_HEIGHT, yToYear } from "./timeline";

const $ = <T extends HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

const timelineEl = $("#timeline");
const yearReadout = $("#year-readout");
const eraReadout = $("#era-readout");
const progressEl = $("#timeline-progress");
const progressFill = $<HTMLElement>(".hud-progress-fill");
const hudEl = $(".hud");

// the readout only means something once the scroll gives it a year, so reveal
// the HUD on the first scroll and keep it shown thereafter
const revealHud = (): void => {
  if (window.scrollY > 8) hudEl?.classList.add("is-visible");
};
if (hudEl) {
  window.addEventListener("scroll", revealHud, { passive: true });
  revealHud(); // in case the page loads already scrolled (refresh mid-page)
}

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

const reduceMotion =
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// --- live year readout --------------------------------------------------
if (timelineEl && yearReadout) {
  // the bars sit below a header band, so discount it when mapping scroll to year
  const readHeadH = (): number =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue("--head-h"), 10) || 0;
  let headH = readHeadH();

  const readAt = (): { year: number; progress: number } => {
    const top = timelineEl.offsetTop + headH;
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
  window.addEventListener("resize", () => {
    headH = readHeadH();
    paint();
  });
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

// --- focus highlight: light the map and branch to related civilisations ---
// Focusing a civilisation (hover, keyboard focus, or opening its popup) lights
// its pin on the map, draws connectors to the civilisations it relates to, and
// dims the rest. The relations come from the same pure model the popup uses.
const connectors = document.querySelector<SVGSVGElement>(".connectors");
const nodesLayer = document.querySelector<HTMLElement>(".nodes");
const civBars = Array.from(document.querySelectorAll<HTMLElement>(".civ[data-civ]"));
const barById = new Map(civBars.map((b) => [b.dataset.civ ?? "", b]));
const groupHeads = Array.from(document.querySelectorAll<HTMLElement>(".group-head"));
const SVG_NS = "http://www.w3.org/2000/svg";

// The sticky icons pin near the top of the viewport, right where the fixed year
// readout sits, so a leftmost bar's emblem would hide behind it. Any bar whose
// icon column overlaps the HUD box gets its sticky top pushed below the HUD. The
// HUD is fixed and the bar x-positions are percentage-based, so this only needs
// recomputing on load and resize, never on scroll.
const layoutIcons = (): void => {
  if (!hudEl) return;
  const hud = hudEl.getBoundingClientRect();
  const half = 15; // the icon is 30px wide, centred in its bar
  for (const b of civBars) {
    const icon = b.querySelector<HTMLElement>(".civ-icon");
    if (!icon) continue;
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const underHud = cx + half > hud.left && cx - half < hud.right;
    if (underHud) icon.style.setProperty("--icon-top", `${Math.round(hud.bottom + 8)}px`);
    else icon.style.removeProperty("--icon-top");
  }
};
layoutIcons();
requestAnimationFrame(layoutIcons); // rerun once fonts and layout have settled
window.addEventListener("resize", layoutIcons);

// The year milestone labels ride down the same gutter as the sticky vertical era
// name. When a label reaches the era name's band they would print on top of each
// other, so slide the year clear of the era text while they coincide. A
// translateX moves the label sideways only, so its measured top/bottom never
// change and the test below cannot oscillate.
const eraNames = Array.from(document.querySelectorAll<HTMLElement>(".era-band-name"));
const markLabels = Array.from(document.querySelectorAll<HTMLElement>(".era-mark-label"));
const layoutMarks = (): void => {
  const vh = window.innerHeight;
  for (const label of markLabels) {
    const lr = label.getBoundingClientRect();
    let hit = false;
    if (lr.bottom >= 0 && lr.top <= vh) {
      for (const name of eraNames) {
        const nr = name.getBoundingClientRect();
        // both sit in the gutter, so overlapping heights means they collide
        if (lr.top < nr.bottom && lr.bottom > nr.top) {
          hit = true;
          break;
        }
      }
    }
    label.classList.toggle("is-shifted", hit);
  }
};
layoutMarks();
let markTick = false;
window.addEventListener(
  "scroll",
  () => {
    if (markTick) return;
    markTick = true;
    requestAnimationFrame(() => {
      layoutMarks();
      markTick = false;
    });
  },
  { passive: true },
);
window.addEventListener("resize", layoutMarks);

let shownId: string | null = null; // the civ currently lit
let lockedId: string | null = null; // a civ pinned lit while its popup is open

const relatedKinds = (id: string): Map<string, RelationKind> => {
  const { outgoing, incoming } = relationsOf(id);
  const m = new Map<string, RelationKind>();
  for (const e of outgoing) m.set(e.civ.id, e.kind);
  for (const e of incoming) if (!m.has(e.civ.id)) m.set(e.civ.id, e.kind);
  return m;
};

// clear only the drawn branches, leaving the arrowhead <defs> in place
const clearConnectors = (): void => {
  for (const el of connectors?.querySelectorAll(".connector, .connector-rival-mark") ?? [])
    el.remove();
};

const drawConnectors = (id: string): void => {
  if (!connectors || !timelineEl) return;
  clearConnectors();
  const from = barById.get(id);
  if (!from) return;
  const tl = timelineEl.getBoundingClientRect();
  // viewBox spans the whole timeline box (bars sit below a header band, so the
  // box is taller than TIMELINE_HEIGHT); origins are measured from tl.top, so a
  // 1:1 viewBox keeps the branches aligned with the bars whatever the band.
  connectors.setAttribute("viewBox", `0 0 ${tl.width} ${tl.height}`);
  // Every bar carries an always-on icon that rides the top of its visible span,
  // so anchor branches to those icons: the lines then join the emblems you can
  // actually see rather than birth points scrolled off the top. This is redrawn
  // on scroll (below) so the branches track the icons as they ride.
  const origin = (el: HTMLElement): { x: number; y: number } => {
    const icon = el.querySelector<HTMLElement>(".civ-icon");
    const r = (icon ?? el).getBoundingClientRect();
    return { x: r.left - tl.left + r.width / 2, y: r.top - tl.top + r.height / 2 };
  };
  const a = origin(from);

  // Draw each tie in its real direction. Successor and influence carry an
  // arrowhead (marker-end), so the branch has to run from the source to the
  // target: outgoing points away from the focused civ, incoming points back to
  // it. Rivalry is mutual, so it gets no arrow and an X at its midpoint instead.
  const drawEdge = (otherId: string, kind: RelationKind, pointToOther: boolean): void => {
    const other = barById.get(otherId);
    if (!other) return;
    const b = origin(other);
    const [rawP, rawQ] = pointToOther ? [a, b] : [b, a];
    // both branches approach their ends horizontally, so pull each end back
    // along the x it leaves on: the line then starts and stops beside the
    // emblems instead of running across them. The arrowed end gets the larger
    // gap so the arrowhead sits just outside the target's 30px icon.
    const dir = rawQ.x >= rawP.x ? 1 : -1;
    const iconGap = 16;
    const arrowGap = 18;
    const p = { x: rawP.x + dir * iconGap, y: rawP.y };
    const q =
      kind === "rival"
        ? { x: rawQ.x - dir * iconGap, y: rawQ.y }
        : { x: rawQ.x - dir * arrowGap, y: rawQ.y };
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", connectorPath(p, q));
    path.setAttribute("class", `connector connector-${kind}`);
    connectors.appendChild(path);
    if (kind === "rival") {
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      const s = 5;
      const mark = document.createElementNS(SVG_NS, "path");
      mark.setAttribute(
        "d",
        `M${mx - s} ${my - s} L${mx + s} ${my + s} M${mx + s} ${my - s} L${mx - s} ${my + s}`,
      );
      mark.setAttribute("class", "connector-rival-mark");
      connectors.appendChild(mark);
    }
  };

  const { outgoing, incoming } = relationsOf(id);
  const drawn = new Set<string>();
  for (const e of outgoing) {
    drawEdge(e.civ.id, e.kind, true);
    drawn.add(`${e.civ.id}:${e.kind}`);
  }
  for (const e of incoming) {
    if (!drawn.has(`${e.civ.id}:${e.kind}`)) drawEdge(e.civ.id, e.kind, false);
  }
};

const light = (id: string): void => {
  const related = relatedKinds(id);
  for (const b of civBars) {
    const bid = b.dataset.civ ?? "";
    b.classList.toggle("active", bid === id);
    b.classList.toggle("related", related.has(bid));
    b.classList.toggle("dimmed", bid !== id && !related.has(bid));
  }
  // expand the (often truncated) column name of the group this civ belongs to
  const activeGroup = barById.get(id)?.dataset.group ?? "";
  for (const h of groupHeads) h.classList.toggle("is-active", h.id === `group-${activeGroup}`);
  drawConnectors(id);
  shownId = id;
};

const clearLight = (): void => {
  for (const b of civBars) b.classList.remove("active", "related", "dimmed");
  for (const h of groupHeads) h.classList.remove("is-active");
  clearConnectors();
  nodesLayer?.replaceChildren();
  shownId = null;
};

const activate = (id: string): void => {
  if (lockedId) return; // while a popup is open it owns the highlight
  light(id);
};
const deactivate = (): void => {
  if (!lockedId) clearLight();
};

// --- floating tooltip: name + dates, under the cursor -------------------
const tipEl = document.getElementById("civ-tip");
const civById = new Map(CIVILISATIONS.map((c) => [c.id, c]));

const showTip = (id: string): boolean => {
  const c = civById.get(id);
  if (!tipEl || !c) return false;
  const name = document.createElement("span");
  name.className = "civ-tip-name";
  name.textContent = c.name;
  const dates = document.createElement("span");
  dates.className = "civ-tip-dates";
  dates.textContent = `${formatYear(c.start)} to ${formatYear(c.end)}`;
  tipEl.replaceChildren(name, dates);
  tipEl.hidden = false;
  return true;
};

const hideTip = (): void => {
  if (tipEl) tipEl.hidden = true;
};

// place the tooltip near a point, flipping to stay inside the viewport
const placeTip = (x: number, y: number): void => {
  if (!tipEl || tipEl.hidden) return;
  const pad = 14;
  const r = tipEl.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + r.width > window.innerWidth - 8) left = x - pad - r.width;
  if (top + r.height > window.innerHeight - 8) top = y - pad - r.height;
  tipEl.style.left = `${Math.max(8, left)}px`;
  tipEl.style.top = `${Math.max(8, top)}px`;
};

for (const b of civBars) {
  const id = b.dataset.civ ?? "";
  b.addEventListener("pointerenter", (e) => {
    activate(id);
    if (showTip(id)) placeTip(e.clientX, e.clientY);
  });
  b.addEventListener("pointermove", (e) => placeTip(e.clientX, e.clientY));
  b.addEventListener("focus", () => {
    activate(id);
    if (showTip(id)) {
      const r = b.getBoundingClientRect(); // no cursor on keyboard: anchor to the bar
      placeTip(r.left + r.width / 2, r.top);
    }
  });
  b.addEventListener("pointerleave", () => {
    deactivate();
    hideTip();
  });
  b.addEventListener("blur", () => {
    deactivate();
    hideTip();
  });
}

// lane widths are percentages, so re-measure the live connectors on resize
window.addEventListener("resize", () => {
  if (shownId) drawConnectors(shownId);
});

// the branches anchor to the sticky icons, which move as you scroll, so redraw
// them each frame while a civilisation is lit (throttled to one draw per frame)
let connTick = false;
window.addEventListener(
  "scroll",
  () => {
    if (!shownId || connTick) return;
    connTick = true;
    requestAnimationFrame(() => {
      if (shownId) drawConnectors(shownId);
      connTick = false;
    });
  },
  { passive: true },
);

// --- group rail: jump the horizontal scroll to a group ------------------
// Where the lanes overflow the width (a phone), each rail control scrolls its
// group's column into view. scrollIntoView respects scroll-padding-left, so the
// group lands just past the gutter; block:"nearest" keeps the year unchanged.
for (const btn of document.querySelectorAll<HTMLButtonElement>(".group-rail-btn")) {
  btn.addEventListener("click", () => {
    const head = document.getElementById(`group-${btn.dataset.group ?? ""}`);
    head?.scrollIntoView({ inline: "start", block: "nearest" });
  });
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
  const relationsEl = $("#popup-relations");
  let opener: HTMLElement | null = null;

  const openCiv = (id: string, trigger?: HTMLElement): void => {
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
    fillRelations(id);
    if (trigger) opener = trigger; // keep the first opener when navigating within
    hideTip(); // the popup carries the detail now, so drop the floating tip
    popup.hidden = false;
    lockedId = id;
    light(id);
    popup.querySelector<HTMLButtonElement>(".popup-close")?.focus();
  };

  // grouped, clickable relations built from the same model as the map highlight
  function fillRelations(id: string): void {
    if (!relationsEl) return;
    relationsEl.replaceChildren();
    const { outgoing, incoming } = relationsOf(id);
    const group = (label: string, items: ResolvedRelation[]): void => {
      if (!items.length) return;
      const heading = document.createElement("p");
      heading.className = "popup-rel-label";
      heading.textContent = label;
      relationsEl.appendChild(heading);
      const list = document.createElement("div");
      list.className = "popup-rel-list";
      for (const e of items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `popup-rel popup-rel-${e.kind}`;
        btn.dataset.civ = e.civ.id;
        btn.textContent = e.civ.name;
        btn.addEventListener("click", () => openCiv(e.civ.id));
        list.appendChild(btn);
      }
      relationsEl.appendChild(list);
    };
    const seen = new Set<string>();
    group("Grew from", incoming.filter((e) => e.kind === "successor"));
    group("Gave rise to", outgoing.filter((e) => e.kind === "successor"));
    group("Influenced", outgoing.filter((e) => e.kind === "influence"));
    group("Influenced by", incoming.filter((e) => e.kind === "influence"));
    group(
      "Rival of",
      [...outgoing, ...incoming].filter(
        (e) => e.kind === "rival" && !seen.has(e.civ.id) && seen.add(e.civ.id),
      ),
    );
  }

  const close = (): void => {
    popup.hidden = true;
    lockedId = null;
    clearLight();
    opener?.focus();
    opener = null;
  };

  for (const btn of civBars) {
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

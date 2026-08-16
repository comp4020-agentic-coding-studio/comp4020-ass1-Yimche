import { describe, expect, it } from "vitest";
import { CIVILISATIONS, REGIONS, type Civilisation } from "../src/data/civilisations";
import {
  eraBands,
  eraFor,
  eraMarks,
  formatYear,
  packLanes,
  TIMELINE,
  yearToY,
  yToYear,
} from "../src/scripts/timeline";

// The core interaction is scrolling through time: scroll position maps to a
// year, and each civilisation is a bar spanning its real dates, packed so
// overlapping civilisations never share a lane. These assert the pure model the
// view draws, independent of how it is rendered, so they survive a restyle.

describe("civilisations data", () => {
  it("has a curated set", () => {
    expect(CIVILISATIONS.length).toBeGreaterThanOrEqual(12);
  });

  it("has unique ids", () => {
    const ids = CIVILISATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is well-formed and within the timeline range", () => {
    const regions = new Set<string>(REGIONS);
    for (const c of CIVILISATIONS) {
      expect(c.name.trim().length, `${c.id} name`).toBeGreaterThan(0);
      expect(c.blurb.trim().length, `${c.id} blurb`).toBeGreaterThan(0);
      expect(regions.has(c.region), `${c.id} region "${c.region}"`).toBe(true);
      expect(c.start, `${c.id} start before end`).toBeLessThan(c.end);
      expect(c.start, `${c.id} start in range`).toBeGreaterThanOrEqual(TIMELINE.start);
      expect(c.end, `${c.id} end in range`).toBeLessThanOrEqual(TIMELINE.end);
      expect(c.start, `${c.id} avoids year zero`).not.toBe(0);
      expect(c.end, `${c.id} avoids year zero`).not.toBe(0);
    }
  });

  it("spans from deep antiquity to the present", () => {
    const earliest = Math.min(...CIVILISATIONS.map((c) => c.start));
    const latest = Math.max(...CIVILISATIONS.map((c) => c.end));
    expect(earliest).toBeLessThanOrEqual(-3000);
    expect(latest).toBeGreaterThanOrEqual(1900);
  });

  it("keeps event years inside the civ's own span", () => {
    for (const c of CIVILISATIONS) {
      for (const e of c.events ?? []) {
        expect(e.text.trim().length, `${c.id} event text`).toBeGreaterThan(0);
        expect(e.year, `${c.id} event ${e.text} after start`).toBeGreaterThanOrEqual(c.start);
        expect(e.year, `${c.id} event ${e.text} before end`).toBeLessThanOrEqual(c.end);
      }
    }
  });
});

describe("formatYear", () => {
  it("labels BCE and CE with no year zero", () => {
    expect(formatYear(-3000)).toBe("3000 BCE");
    expect(formatYear(-1)).toBe("1 BCE");
    expect(formatYear(1)).toBe("1 CE");
    expect(formatYear(2026)).toBe("2026 CE");
  });
});

describe("time scale", () => {
  it("puts the start of the timeline at y = 0", () => {
    expect(yearToY(TIMELINE.start)).toBe(0);
  });

  it("is monotonic: later years map further down", () => {
    expect(yearToY(-3000)).toBeLessThan(yearToY(-1000));
    expect(yearToY(500)).toBeLessThan(yearToY(1500));
    expect(yearToY(1500)).toBeLessThan(yearToY(TIMELINE.end));
  });

  it("yToYear inverts yearToY", () => {
    for (const year of [-3500, -1000, 1, 1492, 2026]) {
      expect(yToYear(yearToY(year))).toBeCloseTo(year, 6);
    }
  });
});

describe("eraFor", () => {
  it("names an era for every sampled year in range", () => {
    for (const year of [-3400, -2000, -800, -300, 200, 800, 1400, 1600, 1900, 2020]) {
      expect(eraFor(year).trim().length, `era for ${year}`).toBeGreaterThan(0);
    }
  });
});

describe("packLanes", () => {
  const { packed, lanes } = packLanes();

  it("assigns every civilisation a valid lane", () => {
    expect(packed.length).toBe(CIVILISATIONS.length);
    expect(lanes).toBeGreaterThan(0);
    for (const c of packed) {
      expect(c.lane).toBeGreaterThanOrEqual(0);
      expect(c.lane).toBeLessThan(lanes);
    }
  });

  it("never overlaps two civilisations in the same lane", () => {
    for (let lane = 0; lane < lanes; lane++) {
      const inLane = packed.filter((c) => c.lane === lane).sort((a, b) => a.start - b.start);
      for (let i = 1; i < inLane.length; i++) {
        const prev = inLane[i - 1]!;
        const cur = inLane[i]!;
        expect(prev.end <= cur.start, `${prev.id} overlaps ${cur.id} in lane ${lane}`).toBe(true);
      }
    }
  });

  it("splits an overlapping set into separate lanes and reuses a freed lane", () => {
    const sample: Civilisation[] = [
      { id: "a", name: "A", region: REGIONS[0], start: -100, end: 100, blurb: "x" },
      { id: "b", name: "B", region: REGIONS[0], start: 0, end: 200, blurb: "x" },
      { id: "c", name: "C", region: REGIONS[0], start: 300, end: 400, blurb: "x" },
    ];
    const r = packLanes(sample);
    const la = r.packed.find((c) => c.id === "a")!.lane;
    const lb = r.packed.find((c) => c.id === "b")!.lane;
    expect(la).not.toBe(lb);
    expect(r.lanes).toBe(2);
  });
});

describe("eraBands", () => {
  const bands = eraBands();
  const axisHeight = yearToY(TIMELINE.end);

  it("covers the axis with named, ordered bands", () => {
    expect(bands.length).toBeGreaterThanOrEqual(3);
    for (const b of bands) {
      expect(b.name.trim().length).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    }
    expect(bands[0]!.top).toBe(0);
  });

  it("tiles the axis contiguously with no gaps or overshoot", () => {
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]!.top).toBeCloseTo(bands[i - 1]!.top + bands[i - 1]!.height, 6);
    }
    const last = bands.at(-1)!;
    expect(last.top + last.height).toBeCloseTo(axisHeight, 6);
  });

  it("agrees with eraFor at each band's midpoint", () => {
    for (const b of bands) {
      const midYear = yToYear(b.top + b.height / 2);
      expect(eraFor(Math.round(midYear))).toBe(b.name);
    }
  });
});

describe("eraMarks", () => {
  const marks = eraMarks();

  it("produces labelled gridlines within the timeline", () => {
    expect(marks.length).toBeGreaterThanOrEqual(5);
    for (const m of marks) {
      expect(m.label.trim().length).toBeGreaterThan(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeLessThanOrEqual(yearToY(TIMELINE.end));
    }
  });

  it("orders marks top to bottom by year", () => {
    for (let i = 1; i < marks.length; i++) {
      expect(marks[i]!.y).toBeGreaterThan(marks[i - 1]!.y);
      expect(marks[i]!.year).toBeGreaterThan(marks[i - 1]!.year);
    }
  });
});

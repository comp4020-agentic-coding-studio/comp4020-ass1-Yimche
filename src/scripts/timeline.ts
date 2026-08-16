// The pure model behind the timeline: the mapping between a year and a vertical
// position, human labels for years and eras, and the lane packing that lets
// overlapping civilisations sit side by side. No DOM here, so it can be unit
// tested and reused by both the Astro render and the browser glue.
import { CIVILISATIONS, type Civilisation } from "../data/civilisations";

export const TIMELINE = {
  /** Earliest year on the axis (BCE, so negative). */
  start: -3500,
  /** Present day, the bottom of the axis. */
  end: 2026,
  /** Vertical pixels per year. Sets how long the scroll is. */
  pxPerYear: 1.7,
} as const;

/** Total height of the timeline in pixels. */
export const TIMELINE_HEIGHT = (TIMELINE.end - TIMELINE.start) * TIMELINE.pxPerYear;

/** Year to vertical offset in pixels from the top. Monotonic increasing. */
export function yearToY(year: number): number {
  return (year - TIMELINE.start) * TIMELINE.pxPerYear;
}

/** Inverse of {@link yearToY}: a vertical offset back to a (fractional) year. */
export function yToYear(y: number): number {
  return TIMELINE.start + y / TIMELINE.pxPerYear;
}

/** "3000 BCE" / "1 CE" / "2026 CE". There is no year zero, so 0 is never fed in. */
export function formatYear(year: number): string {
  return year < 0 ? `${-year} BCE` : `${year} CE`;
}

// Broad eras, in order. eraFor returns the first whose upper bound the year is
// below, so the list must be sorted and end with an open-ended catch-all.
const ERAS: { until: number; name: string }[] = [
  { until: -1200, name: "Bronze Age" },
  { until: -550, name: "Iron Age" },
  { until: 500, name: "Classical era" },
  { until: 1500, name: "Middle Ages" },
  { until: 1800, name: "Early Modern era" },
  { until: Infinity, name: "Modern era" },
];

/** A broad era name for any year on the axis. Always non-empty. */
export function eraFor(year: number): string {
  for (const era of ERAS) {
    if (year < era.until) return era.name;
  }
  return "Modern era";
}

export interface PackedCiv extends Civilisation {
  /** Column index, 0-based, assigned so no two civs in a column overlap. */
  lane: number;
}

/**
 * Greedy lane packing. Civilisations are placed left to right by start year;
 * each takes the first column whose previous occupant has already ended,
 * opening a new column only when none is free. Guarantees that two
 * civilisations sharing a column never overlap in time.
 */
export function packLanes(civs: Civilisation[] = CIVILISATIONS): {
  packed: PackedCiv[];
  lanes: number;
} {
  const sorted = [...civs].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = []; // last end year placed in each lane
  const packed: PackedCiv[] = sorted.map((civ) => {
    let lane = laneEnds.findIndex((end) => end <= civ.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(civ.end);
    } else {
      laneEnds[lane] = civ.end;
    }
    return { ...civ, lane };
  });
  return { packed, lanes: laneEnds.length };
}

export interface EraMark {
  year: number;
  y: number;
  label: string;
}

// Round years for the left-margin gridline ticks, like the depth marks on a
// deep-sea page. Kept to the ones that fall inside the axis.
const MARK_YEARS = [-3000, -2000, -1000, 1, 500, 1000, 1500, 2000];

/** Labelled gridlines down the timeline, ordered top to bottom. */
export function eraMarks(): EraMark[] {
  return MARK_YEARS.filter((year) => year >= TIMELINE.start && year <= TIMELINE.end).map(
    (year) => ({ year, y: yearToY(year), label: formatYear(year) }),
  );
}

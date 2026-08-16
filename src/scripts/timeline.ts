// The pure model behind the timeline: the mapping between a year and a vertical
// position, human labels for years and eras, and the lane packing that lets
// overlapping civilisations sit side by side. No DOM here, so it can be unit
// tested and reused by both the Astro render and the browser glue.
import { CIVILISATIONS, GROUPS, groupById, type Civilisation } from "../data/civilisations";

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

export interface EraBand {
  name: string;
  /** Top of the band in pixels from the top of the axis. */
  top: number;
  /** Band height in pixels. */
  height: number;
}

/**
 * The eras as vertical bands down the axis, clipped to [start, end]. Uses the
 * same boundaries as {@link eraFor}, so the gutter labels and the live readout
 * can never disagree about which era a year sits in.
 */
export function eraBands(): EraBand[] {
  const bands: EraBand[] = [];
  let lower: number = TIMELINE.start;
  for (const era of ERAS) {
    const upper = Math.min(era.until, TIMELINE.end);
    if (upper <= lower) continue;
    const top = yearToY(lower);
    bands.push({ name: era.name, top, height: yearToY(upper) - top });
    lower = upper;
    if (lower >= TIMELINE.end) break;
  }
  return bands;
}

export interface PackedCiv extends Civilisation {
  /** Column index, 0-based, assigned so no two civs in a column overlap. */
  lane: number;
}

/** A contiguous block of lanes owned by one group, for the column headers. */
export interface GroupBand {
  id: string;
  name: string;
  region: string;
  /** First lane index this band occupies. */
  startLane: number;
  /** Number of lanes the band packs into. */
  laneCount: number;
}

/**
 * Group-aware greedy lane packing. Civilisations are bucketed by group (in
 * GROUPS order, with any unknown group appended in first-seen order), then each
 * bucket is packed left to right by start year into its own block of lanes:
 * each civ takes the first column in its block whose previous occupant has
 * already ended, opening a new one only when none is free. Blocks are laid out
 * end to end so lane ranges never overlap between groups, which means two
 * civilisations sharing a lane never overlap in time and each group reads as a
 * labelled column band.
 */
export function packLanes(civs: Civilisation[] = CIVILISATIONS): {
  packed: PackedCiv[];
  lanes: number;
  groups: GroupBand[];
} {
  const order = new Map<string, number>();
  GROUPS.forEach((g, i) => order.set(g.id, i));

  // Groups present among these civs, in GROUPS order then first-seen order.
  const firstSeen = new Map<string, number>();
  for (const c of civs) {
    if (!firstSeen.has(c.group)) firstSeen.set(c.group, firstSeen.size);
  }
  const present = [...firstSeen.keys()].sort((a, b) => {
    const ra = order.has(a) ? order.get(a)! : GROUPS.length + firstSeen.get(a)!;
    const rb = order.has(b) ? order.get(b)! : GROUPS.length + firstSeen.get(b)!;
    return ra - rb;
  });

  const packed: PackedCiv[] = [];
  const groups: GroupBand[] = [];
  let laneBase = 0;
  for (const gid of present) {
    const members = civs
      .filter((c) => c.group === gid)
      .sort((a, b) => a.start - b.start || a.end - b.end);
    const laneEnds: number[] = []; // last end year placed in each lane of this block
    for (const civ of members) {
      let lane = laneEnds.findIndex((end) => end <= civ.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(civ.end);
      } else {
        laneEnds[lane] = civ.end;
      }
      packed.push({ ...civ, lane: laneBase + lane });
    }
    const meta = groupById.get(gid);
    groups.push({
      id: gid,
      name: meta?.name ?? gid,
      region: meta?.region ?? members[0]!.region,
      startLane: laneBase,
      laneCount: laneEnds.length,
    });
    laneBase += laneEnds.length;
  }
  return { packed, lanes: laneBase, groups };
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

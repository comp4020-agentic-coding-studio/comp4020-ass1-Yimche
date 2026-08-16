import { describe, expect, it } from "vitest";
import { CIVILISATIONS, GROUPS, groupById, iconFor, REGIONS } from "../src/data/civilisations";
import { packLanes } from "../src/scripts/timeline";

// The next contract: the timeline is broken into finer sub-groups than the eight
// regions. Each civilisation belongs to a group, groups pack their own lanes side
// by side, and the packer reports a band per group so the view can label the
// columns. This asserts the pure model the grouped layout draws, independent of
// the DOM. Committed red on its own per the test-first carve-out in AGENTS.md.

describe("groups", () => {
  it("defines an ordered, non-empty list of groups", () => {
    expect(Array.isArray(GROUPS)).toBe(true);
    expect(GROUPS.length).toBeGreaterThanOrEqual(12);
  });

  it("gives every group a name and a real region", () => {
    const regions = new Set<string>(REGIONS);
    const ids = new Set<string>();
    for (const g of GROUPS) {
      expect(g.id.trim().length, `group id`).toBeGreaterThan(0);
      expect(g.name.trim().length, `${g.id} name`).toBeGreaterThan(0);
      expect(regions.has(g.region), `${g.id} region "${g.region}"`).toBe(true);
      expect(ids.has(g.id), `duplicate group id ${g.id}`).toBe(false);
      ids.add(g.id);
    }
  });

  it("keeps same-region groups contiguous so each region reads as one colour band", () => {
    const seen = new Set<string>();
    let prev = "";
    for (const g of GROUPS) {
      if (g.region !== prev) {
        expect(seen.has(g.region), `region ${g.region} is split across the order`).toBe(false);
        seen.add(g.region);
        prev = g.region;
      }
    }
  });
});

describe("civilisations belong to groups", () => {
  it("puts every civilisation in a real group whose region it shares", () => {
    for (const c of CIVILISATIONS) {
      const g = groupById.get(c.group);
      expect(g, `${c.id} group "${c.group}" is not a real group`).toBeTruthy();
      expect(c.region, `${c.id} region must match its group ${c.group}`).toBe(g?.region);
    }
  });

  it("resolves an architecture icon id for every civilisation", () => {
    for (const c of CIVILISATIONS) {
      expect(iconFor(c).trim().length, `${c.id} icon`).toBeGreaterThan(0);
    }
  });
});

describe("packLanes: group bands", () => {
  const { packed, lanes, groups } = packLanes();

  it("reports a band per populated group", () => {
    expect(Array.isArray(groups)).toBe(true);
    const populated = new Set(CIVILISATIONS.map((c) => c.group));
    expect(groups.length).toBe(populated.size);
    for (const b of groups) {
      expect(b.name.trim().length, `${b.id} band name`).toBeGreaterThan(0);
      expect(b.laneCount, `${b.id} lane count`).toBeGreaterThan(0);
    }
  });

  it("tiles the lanes with disjoint bands covering the whole width", () => {
    const ordered = [...groups].sort((a, b) => a.startLane - b.startLane);
    let cursor = 0;
    for (const b of ordered) {
      expect(b.startLane, `${b.id} starts after the previous band`).toBeGreaterThanOrEqual(cursor);
      cursor = b.startLane + b.laneCount;
    }
    expect(cursor).toBeLessThanOrEqual(lanes);
  });

  it("places every civilisation inside its own group's band", () => {
    const band = new Map(groups.map((b) => [b.id, b]));
    for (const c of packed) {
      const b = band.get(c.group);
      expect(b, `${c.id} band for group ${c.group}`).toBeTruthy();
      if (!b) continue;
      expect(c.lane, `${c.id} lane above band start`).toBeGreaterThanOrEqual(b.startLane);
      expect(c.lane, `${c.id} lane below band end`).toBeLessThan(b.startLane + b.laneCount);
    }
  });
});

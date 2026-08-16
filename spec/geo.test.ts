import { describe, expect, it } from "vitest";
import { CIVILISATIONS, RELATION_KINDS } from "../src/data/civilisations";
import { connectorPath, project, relationsOf } from "../src/scripts/geo";

// The timeline answers "when". These add "where" and "how they relate": each
// civilisation has a real location projected onto an equirectangular map, and a
// set of directed relations to other civilisations. This asserts the pure model
// the map layer and the focus-highlight draw, independent of the DOM.

describe("civilisation locations", () => {
  it("gives every civilisation a plausible latitude and longitude", () => {
    for (const c of CIVILISATIONS) {
      expect(Number.isFinite(c.lat), `${c.id} lat`).toBe(true);
      expect(Number.isFinite(c.lon), `${c.id} lon`).toBe(true);
      expect(c.lat, `${c.id} lat in range`).toBeGreaterThanOrEqual(-90);
      expect(c.lat, `${c.id} lat in range`).toBeLessThanOrEqual(90);
      expect(c.lon, `${c.id} lon in range`).toBeGreaterThanOrEqual(-180);
      expect(c.lon, `${c.id} lon in range`).toBeLessThanOrEqual(180);
    }
  });
});

describe("project", () => {
  it("maps the equirectangular corners and centre", () => {
    const w = 360;
    const h = 180;
    expect(project(90, -180, w, h)).toEqual({ x: 0, y: 0 });
    expect(project(-90, 180, w, h)).toEqual({ x: w, y: h });
    expect(project(0, 0, w, h)).toEqual({ x: w / 2, y: h / 2 });
  });

  it("keeps every civilisation inside the map bounds", () => {
    const w = 1000;
    const h = 500;
    for (const c of CIVILISATIONS) {
      const p = project(c.lat, c.lon, w, h);
      expect(p.x, `${c.id} x`).toBeGreaterThanOrEqual(0);
      expect(p.x, `${c.id} x`).toBeLessThanOrEqual(w);
      expect(p.y, `${c.id} y`).toBeGreaterThanOrEqual(0);
      expect(p.y, `${c.id} y`).toBeLessThanOrEqual(h);
    }
  });

  it("puts northern places above southern ones and eastern right of western", () => {
    const w = 360;
    const h = 180;
    expect(project(40, 0, w, h).y).toBeLessThan(project(-40, 0, w, h).y);
    expect(project(0, 100, w, h).x).toBeGreaterThan(project(0, -100, w, h).x);
  });
});

describe("connectorPath", () => {
  it("returns a non-empty SVG path that touches both endpoints", () => {
    const d = connectorPath({ x: 10, y: 20 }, { x: 200, y: 400 });
    expect(d.trim().length).toBeGreaterThan(0);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("10");
    expect(d).toContain("200");
    expect(d).toContain("400");
  });
});

describe("relations", () => {
  const ids = new Set(CIVILISATIONS.map((c) => c.id));

  it("only points at real civilisations, never itself, with a known kind", () => {
    for (const c of CIVILISATIONS) {
      for (const r of c.relations ?? []) {
        expect(ids.has(r.to), `${c.id} -> unknown ${r.to}`).toBe(true);
        expect(r.to, `${c.id} relates to itself`).not.toBe(c.id);
        expect(RELATION_KINDS.includes(r.kind), `${c.id} -> ${r.to} bad kind ${r.kind}`).toBe(true);
      }
    }
  });

  it("has a connected graph: most civilisations relate to at least one other", () => {
    const touched = new Set<string>();
    for (const c of CIVILISATIONS) {
      for (const r of c.relations ?? []) {
        touched.add(c.id);
        touched.add(r.to);
      }
    }
    expect(touched.size).toBeGreaterThanOrEqual(Math.ceil(CIVILISATIONS.length * 0.7));
  });

  it("relationsOf resolves outgoing and incoming edges to civ records", () => {
    const withRelation = CIVILISATIONS.find((c) => (c.relations ?? []).length > 0)!;
    const target = withRelation.relations![0]!.to;

    const out = relationsOf(withRelation.id);
    expect(out.outgoing.some((e) => e.civ.id === target)).toBe(true);

    const back = relationsOf(target);
    expect(back.incoming.some((e) => e.civ.id === withRelation.id)).toBe(true);

    for (const e of [...out.outgoing, ...out.incoming]) {
      expect(ids.has(e.civ.id)).toBe(true);
      expect(RELATION_KINDS.includes(e.kind)).toBe(true);
    }
  });

  it("returns empty edge lists for an unknown id rather than throwing", () => {
    const r = relationsOf("not-a-real-civ");
    expect(r.outgoing).toEqual([]);
    expect(r.incoming).toEqual([]);
  });
});

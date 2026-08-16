// The pure model behind "where" and "how they relate": projecting a location
// onto an equirectangular map, drawing a connector between two points, and
// resolving a civilisation's relations both ways. No DOM here, so the Astro
// render, the browser glue, and the tests all draw on one source of truth.
import { CIVILISATIONS, type Civilisation, type RelationKind } from "../data/civilisations";

export interface Point {
  x: number;
  y: number;
}

/**
 * Equirectangular (Plate Carree) projection: longitude maps linearly across the
 * width, latitude linearly down the height. The faint world map is drawn in the
 * same projection, so a civilisation's pin lands on its real spot.
 */
export function project(lat: number, lon: number, w: number, h: number): Point {
  return {
    x: ((lon + 180) / 360) * w,
    y: ((90 - lat) / 180) * h,
  };
}

/**
 * A cubic-bezier SVG path from a to b, bowed horizontally so relation
 * connectors read as branches between lanes rather than straight diagonals.
 */
export function connectorPath(a: Point, b: Point): string {
  const midX = (a.x + b.x) / 2;
  return `M${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
}

export interface ResolvedRelation {
  civ: Civilisation;
  kind: RelationKind;
}

/**
 * Every tie touching a civilisation, resolved to civ records: the ones it points
 * at (outgoing) and the ones that point at it (incoming). An unknown id yields
 * empty lists rather than throwing, so callers need not pre-check.
 */
export function relationsOf(id: string): {
  outgoing: ResolvedRelation[];
  incoming: ResolvedRelation[];
} {
  const byId = new Map(CIVILISATIONS.map((c) => [c.id, c]));

  const outgoing: ResolvedRelation[] = [];
  for (const r of byId.get(id)?.relations ?? []) {
    const civ = byId.get(r.to);
    if (civ) outgoing.push({ civ, kind: r.kind });
  }

  const incoming: ResolvedRelation[] = [];
  for (const c of CIVILISATIONS) {
    if (c.id === id) continue;
    for (const r of c.relations ?? []) {
      if (r.to === id) incoming.push({ civ: c, kind: r.kind });
    }
  }

  return { outgoing, incoming };
}

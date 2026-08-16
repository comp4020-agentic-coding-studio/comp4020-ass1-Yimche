// The sequencing model: one runway serves one plane at a time, holding
// arrivals burn fuel, and a runway stays locked for a separation gap after a
// clearance. This module is pure (no DOM, no timers) so the core interaction
// can be unit-tested without a browser; main.ts is the only place that touches
// the document. Every function returns a fresh state and never mutates its
// input, so the render layer can diff old against new.

export type PlaneKind = "arrival" | "departure";

export type Phase =
  | "holding" // arrival circling, waiting for a runway (burns fuel)
  | "runway" // cleared, occupying a runway now
  | "gate" // arrival has landed and taxied in
  | "departed" // departure is airborne and gone
  | "emergency" // arrival out of fuel while still holding
  | "diverted"; // sent away

export interface Plane {
  id: string;
  flight: string;
  kind: PlaneKind;
  phase: Phase;
  fuel: number; // seconds of fuel left; only meaningful while holding
  runwayId: string | null;
}

export interface Runway {
  id: string;
  busyUntil: number; // sim-time (ms) the runway is locked until; <= t means free
}

export interface SimState {
  t: number; // elapsed sim time in ms
  planes: Plane[];
  runways: Runway[];
}

export type ClearResult =
  | { ok: true; state: SimState }
  | { ok: false; reason: string };

// A runway is locked for this long after each clearance (service + separation).
export const SEPARATION_MS = 8000;
// Fuel burned per second while an arrival holds.
export const FUEL_BURN_PER_SEC = 1;
// Fuel an arrival starts with.
export const START_FUEL = 20;

export function isRunwayFree(runway: Runway, t: number): boolean {
  return runway.busyUntil <= t;
}

export function isClearable(plane: Plane): boolean {
  if (plane.kind === "arrival")
    return plane.phase === "holding" || plane.phase === "emergency";
  return plane.phase === "gate";
}

export function createInitialState(): SimState {
  return {
    t: 0,
    planes: [
      { id: "p1", flight: "QF12", kind: "arrival", phase: "holding", fuel: 8, runwayId: null },
      { id: "p2", flight: "VA88", kind: "arrival", phase: "holding", fuel: START_FUEL, runwayId: null },
      { id: "p3", flight: "JQ5", kind: "departure", phase: "gate", fuel: START_FUEL, runwayId: null },
    ],
    runways: [
      { id: "27", busyUntil: 0 },
      { id: "34", busyUntil: 0 },
    ],
  };
}

// Advance the world by dtMs. Holding arrivals burn fuel (and tip into an
// emergency at empty); a plane whose runway's separation gap has elapsed
// completes (arrival taxis to a gate, departure gets airborne) and releases
// the runway.
export function tick(state: SimState, dtMs: number): SimState {
  const t = state.t + dtMs;
  const burn = (dtMs / 1000) * FUEL_BURN_PER_SEC;

  const planes = state.planes.map((plane) => {
    if (plane.phase === "holding" && plane.kind === "arrival") {
      const fuel = plane.fuel - burn;
      if (fuel <= 0) return { ...plane, fuel: 0, phase: "emergency" as const };
      return { ...plane, fuel };
    }
    if (plane.phase === "runway" && plane.runwayId) {
      const runway = state.runways.find((r) => r.id === plane.runwayId);
      if (runway && runway.busyUntil <= t) {
        const landed = plane.kind === "arrival";
        return {
          ...plane,
          phase: landed ? ("gate" as const) : ("departed" as const),
          runwayId: null,
        };
      }
    }
    return plane;
  });

  return { t, planes, runways: state.runways.map((r) => ({ ...r })) };
}

// Try to put a plane on a runway. Fails if the plane can't be cleared right now
// or the runway is still inside its separation gap; the scarce resource is what
// makes the sequencing a real decision.
export function clear(
  state: SimState,
  planeId: string,
  runwayId: string,
): ClearResult {
  const plane = state.planes.find((p) => p.id === planeId);
  if (!plane) return { ok: false, reason: `no plane ${planeId}` };
  if (!isClearable(plane))
    return { ok: false, reason: `${plane.flight} is not waiting for a runway` };

  const runway = state.runways.find((r) => r.id === runwayId);
  if (!runway) return { ok: false, reason: `no runway ${runwayId}` };
  if (!isRunwayFree(runway, state.t))
    return { ok: false, reason: `runway ${runwayId} still occupied` };

  return {
    ok: true,
    state: {
      t: state.t,
      planes: state.planes.map((p) =>
        p.id === planeId
          ? { ...p, phase: "runway" as const, runwayId }
          : { ...p },
      ),
      runways: state.runways.map((r) =>
        r.id === runwayId ? { ...r, busyUntil: state.t + SEPARATION_MS } : { ...r },
      ),
    },
  };
}

// Why one plane goes before another. This is the decision the controller makes,
// expressed as a pure function of the state so the "inside ATC" view can explain
// its own reasoning and the rule can be unit-tested directly.
export type RuleTag = "emergency" | "low-fuel" | "departure" | "hold";

export interface Recommendation {
  planeId: string;
  flight: string;
  runwayId: string | null; // the free runway to use, or null if none is free
  action: string;
  reason: string;
  rule: RuleTag;
}

// Rank: an emergency always wins, then the holding arrival with the least fuel
// (before it becomes the next emergency), then departures. Ties break on fuel.
function priorityKey(p: Plane): number {
  if (p.phase === "emergency") return 0;
  if (p.kind === "arrival") return 1;
  return 2;
}

// The next clearance the controller should make, and the rule behind it. Returns
// null when nothing is waiting for a runway.
export function recommend(state: SimState): Recommendation | null {
  const waiting = state.planes.filter(isClearable);
  if (waiting.length === 0) return null;

  const ranked = [...waiting].sort(
    (a, b) => priorityKey(a) - priorityKey(b) || a.fuel - b.fuel,
  );
  const top = ranked[0]!;
  const freeRunway = state.runways.find((r) => isRunwayFree(r, state.t));

  if (!freeRunway) {
    return {
      planeId: top.id,
      flight: top.flight,
      runwayId: null,
      action: "Everyone holds",
      reason:
        "Both runways are inside their separation gap, so no one can be cleared yet. The rest keep circling.",
      rule: "hold",
    };
  }

  const rid = freeRunway.id;
  if (top.phase === "emergency") {
    return {
      planeId: top.id,
      flight: top.flight,
      runwayId: rid,
      action: `Land ${top.flight} on ${rid}`,
      reason: `${top.flight} is out of fuel and has declared an emergency, so it jumps the queue ahead of everyone.`,
      rule: "emergency",
    };
  }
  if (top.kind === "arrival") {
    return {
      planeId: top.id,
      flight: top.flight,
      runwayId: rid,
      action: `Land ${top.flight} on ${rid}`,
      reason: `${top.flight} has the least fuel of the holding arrivals, so it goes next before it runs dry.`,
      rule: "low-fuel",
    };
  }
  return {
    planeId: top.id,
    flight: top.flight,
    runwayId: rid,
    action: `Depart ${top.flight} from ${rid}`,
    reason: `No arrivals are waiting on fuel, so ${top.flight} can take the free runway to depart.`,
    rule: "departure",
  };
}

let nextId = 0;
const ARRIVALS = ["QF", "VA", "JQ", "NZ", "SQ", "EK", "UA", "CX"];

// Add a plane. Defaults to a fresh holding arrival with a full tank; callers can
// override any field (e.g. to add a departure at a gate).
export function addPlane(state: SimState, plane?: Partial<Plane>): SimState {
  nextId += 1;
  const flight = `${ARRIVALS[nextId % ARRIVALS.length]}${10 + nextId}`;
  const added: Plane = {
    id: `p-${Date.now()}-${nextId}`,
    flight,
    kind: "arrival",
    phase: "holding",
    fuel: START_FUEL,
    runwayId: null,
    ...plane,
  };
  return { ...state, planes: [...state.planes, added] };
}

export function removePlane(state: SimState, planeId: string): SimState {
  return { ...state, planes: state.planes.filter((p) => p.id !== planeId) };
}

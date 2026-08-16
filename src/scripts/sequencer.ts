// The sequencing model: one runway serves one plane at a time, holding
// arrivals burn fuel, and a runway stays locked for a separation gap after a
// clearance. This module is pure (no DOM, no timers) so the core interaction
// can be unit-tested without a browser; main.ts is the only place that touches
// the document.
//
// STUB: signatures and types are final, behaviour is deliberately absent so the
// contract test in spec/sequencer.test.ts is red. The next commit fills these
// in. See AGENTS.md on why the red is committed on its own.

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

// STUB — returns the state untouched.
export function tick(state: SimState, _dtMs: number): SimState {
  return state;
}

// STUB — accepts every clearance without moving anything.
export function clear(
  state: SimState,
  _planeId: string,
  _runwayId: string,
): ClearResult {
  return { ok: true, state };
}

// STUB — returns the state untouched.
export function addPlane(state: SimState, _plane?: Partial<Plane>): SimState {
  return state;
}

// STUB — returns the state untouched.
export function removePlane(state: SimState, _planeId: string): SimState {
  return state;
}

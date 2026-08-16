// The scripted ATC demo, as pure data plus pure derivation. There is no
// simulation here: a fixed sequence of keyframes (beats) choreographs a few
// planes, and the view interpolates between them. Keeping it pure (no DOM, no
// timers) means the whole choreography can be unit-tested, and main.ts is the
// only place that touches the document.
//
// The teaching point rides on the ordering of the beats: an arrival low on fuel
// lands first, one runway serves one plane at a time, and a departure only
// leaves once no arrival is holding.

export type PlaneKind = "arrival" | "departure";

export type Phase =
  | "holding" // arrival circling overhead, waiting for a runway
  | "approach" // cleared to land, lining up
  | "landing" // on the runway now (runway is busy)
  | "taxi" // landed, taxiing clear of the runway
  | "gate" // parked at a gate (arrival) or waiting to depart (departure)
  | "departing" // rolling down the runway to take off
  | "gone"; // airborne and clear of the pattern

// The list is exported so a test can assert every pose uses a real phase.
export const PHASES: readonly Phase[] = [
  "holding",
  "approach",
  "landing",
  "taxi",
  "gate",
  "departing",
  "gone",
];

export interface Plane {
  id: string;
  name: string; // "Plane 1", "Plane 2", ...
  kind: PlaneKind;
}

// Percentages within the scene: x from the left, y from the top.
export interface Pose {
  x: number;
  y: number;
  phase: Phase;
}

export interface Beat {
  callout: string; // what the tower is announcing on this beat
  directing: string | null; // the plane being directed now, or null
  poses: Record<string, Pose>; // one pose per plane id
}

export const PLANES: readonly Plane[] = [
  { id: "p1", name: "Plane 1", kind: "arrival" },
  { id: "p2", name: "Plane 2", kind: "arrival" },
  { id: "p3", name: "Plane 3", kind: "departure" },
];

// The scripted choreography, authored as keyframes. Positions are scene
// percentages: the big departure waits at the apron far left, arrivals hold
// high over the field, the single runway sits low and centre. The order of the
// beats is the lesson.
export const SCENARIO: readonly Beat[] = [
  {
    callout: "Two arrivals are holding overhead. Plane 3 waits at the gate to depart.",
    directing: null,
    poses: {
      p1: { x: 40, y: 16, phase: "holding" },
      p2: { x: 58, y: 12, phase: "holding" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "Plane 1 is lowest on fuel, so it is cleared to land first on runway 27.",
    directing: "p1",
    poses: {
      p1: { x: 43, y: 46, phase: "approach" },
      p2: { x: 56, y: 15, phase: "holding" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "Plane 1 is on runway 27. One runway serves one plane, so the rest keep circling.",
    directing: "p1",
    poses: {
      p1: { x: 46, y: 83, phase: "landing" },
      p2: { x: 60, y: 13, phase: "holding" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "Plane 1 clears the runway and taxis in. Runway 27 is free again.",
    directing: null,
    poses: {
      p1: { x: 32, y: 76, phase: "taxi" },
      p2: { x: 57, y: 16, phase: "holding" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "With the runway clear, Plane 2 is cleared to land on runway 27.",
    directing: "p2",
    poses: {
      p1: { x: 20, y: 70, phase: "gate" },
      p2: { x: 43, y: 46, phase: "approach" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "Plane 2 touches down. Arrivals on fuel always come before a waiting departure.",
    directing: "p2",
    poses: {
      p1: { x: 20, y: 70, phase: "gate" },
      p2: { x: 46, y: 83, phase: "landing" },
      p3: { x: 13, y: 69, phase: "gate" },
    },
  },
  {
    callout: "No arrivals are left holding, so Plane 3 is cleared to take off from runway 27.",
    directing: "p3",
    poses: {
      p1: { x: 20, y: 70, phase: "gate" },
      p2: { x: 32, y: 76, phase: "taxi" },
      p3: { x: 46, y: 83, phase: "departing" },
    },
  },
  {
    callout: "Plane 3 is airborne and clear. Fresh traffic checks in and the cycle begins again.",
    directing: null,
    poses: {
      p1: { x: 20, y: 70, phase: "gate" },
      p2: { x: 28, y: 73, phase: "gate" },
      p3: { x: 96, y: -12, phase: "gone" },
    },
  },
];

// --- derivation the view draws ------------------------------------------

export interface PlanePose extends Plane {
  x: number;
  y: number;
  phase: Phase;
  directing: boolean;
}

export interface SceneState {
  beatIndex: number;
  callout: string;
  directing: string | null;
  planes: PlanePose[];
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// The scene at a given beat and progress (0..1) through it. Positions
// interpolate toward the next beat (wrapping at the end so the demo loops);
// phase is the current beat's phase. Pure function of its inputs.
export function sceneAt(beatIndex: number, progress: number): SceneState {
  const n = SCENARIO.length;
  if (n === 0) {
    return { beatIndex: 0, callout: "", directing: null, planes: [] };
  }
  const i = ((beatIndex % n) + n) % n;
  const next = (i + 1) % n;
  const t = Math.max(0, Math.min(1, progress));
  const from = SCENARIO[i]!;
  const to = SCENARIO[next]!;

  const planes: PlanePose[] = PLANES.map((plane) => {
    const a = from.poses[plane.id]!;
    const b = to.poses[plane.id]!;
    return {
      ...plane,
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      phase: a.phase,
      directing: from.directing === plane.id,
    };
  });

  return { beatIndex: i, callout: from.callout, directing: from.directing, planes };
}

// --- board + blurbs ------------------------------------------------------

export interface BoardRow {
  id: string;
  name: string;
  status: string;
}

const STATUS: Record<Phase, string> = {
  holding: "Holding",
  approach: "On approach",
  landing: "Landing",
  taxi: "Taxiing in",
  gate: "At gate",
  departing: "Departing",
  gone: "Departed",
};

export function statusLabel(phase: Phase): string {
  return STATUS[phase];
}

// Group the current scene into the two columns the sky board shows.
export function boardFor(state: SceneState): { arrivals: BoardRow[]; takeoff: BoardRow[] } {
  const arrivals: BoardRow[] = [];
  const takeoff: BoardRow[] = [];
  for (const p of state.planes) {
    const row: BoardRow = { id: p.id, name: p.name, status: statusLabel(p.phase) };
    (p.kind === "arrival" ? arrivals : takeoff).push(row);
  }
  return { arrivals, takeoff };
}

// What a plane's popup says about what it is doing right now, and why.
export function planeBlurb(planeId: string, state: SceneState): string {
  const p = state.planes.find((x) => x.id === planeId);
  if (!p) return "";
  const name = p.name;
  switch (p.phase) {
    case "holding":
      return `${name} is circling a holding pattern, burning fuel while it waits for a free runway. The arrival with the least fuel is cleared first.`;
    case "approach":
      return `${name} has been cleared to land and is lining up for runway 27.`;
    case "landing":
      return `${name} is on the runway. A runway serves one plane at a time, so everyone else has to wait.`;
    case "taxi":
      return `${name} has landed and is taxiing to the gate, which frees the runway for the next plane.`;
    case "gate":
      return p.kind === "departure"
        ? `${name} is at the gate, ready to depart as soon as the runway is clear of arrivals.`
        : `${name} has arrived and is parked at the gate.`;
    case "departing":
      return `${name} has been cleared for take-off and is rolling down runway 27.`;
    case "gone":
      return `${name} is airborne and has left the pattern.`;
  }
}

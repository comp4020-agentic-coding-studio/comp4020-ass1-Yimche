import { describe, expect, it } from "vitest";
import {
  addPlane,
  clear,
  createInitialState,
  isRunwayFree,
  recommend,
  removePlane,
  SEPARATION_MS,
  tick,
  type Plane,
  type SimState,
} from "../src/scripts/sequencer";

// The core-interaction contract: the visitor clears planes onto a scarce
// runway. These assert what the page must DO, independent of how it's drawn,
// so they survive a restyle or a stack change. They are the testable form of
// "the visitor does something that changes what they see".

function holdingArrival(state: SimState): Plane {
  const plane = state.planes.find(
    (p) => p.kind === "arrival" && p.phase === "holding",
  );
  if (!plane) throw new Error("fixture has no holding arrival");
  return plane;
}

describe("sequencer: the scarce runway", () => {
  it("clearing a plane onto a free runway puts it on the runway and locks it", () => {
    const state = createInitialState();
    const plane = holdingArrival(state);
    const runway = state.runways[0];

    const result = clear(state, plane.id, runway.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const moved = result.state.planes.find((p) => p.id === plane.id)!;
    expect(moved.phase).toBe("runway");
    expect(moved.runwayId).toBe(runway.id);

    const locked = result.state.runways.find((r) => r.id === runway.id)!;
    expect(locked.busyUntil).toBe(result.state.t + SEPARATION_MS);
    expect(isRunwayFree(locked, result.state.t)).toBe(false);
  });

  it("rejects a second clearance to a runway still inside its separation gap", () => {
    const state = createInitialState();
    const [first, second] = state.planes.filter(
      (p) => p.kind === "arrival" && p.phase === "holding",
    );
    const runway = state.runways[0];

    const afterFirst = clear(state, first.id, runway.id);
    expect(afterFirst.ok).toBe(true);
    if (!afterFirst.ok) return;

    const afterSecond = clear(afterFirst.state, second.id, runway.id);
    expect(afterSecond.ok).toBe(false);
  });

  it("does not mutate the state passed in (pure)", () => {
    const state = createInitialState();
    const plane = holdingArrival(state);
    const before = plane.phase;
    clear(state, plane.id, state.runways[0].id);
    expect(plane.phase).toBe(before);
  });
});

describe("sequencer: fuel and time", () => {
  it("a holding arrival's fuel strictly decreases as time passes", () => {
    const state = createInitialState();
    const before = holdingArrival(state).fuel;
    const next = tick(state, 3000);
    const after = next.planes.find(
      (p) => p.phase === "holding" && p.kind === "arrival",
    )!.fuel;
    expect(after).toBeLessThan(before);
  });

  it("a holding arrival that runs out of fuel becomes an emergency", () => {
    let state = createInitialState();
    state = tick(state, 60_000); // long enough to drain any holding tank
    const anyEmergency = state.planes.some((p) => p.phase === "emergency");
    expect(anyEmergency).toBe(true);
  });

  it("frees the runway and completes the plane once the separation gap elapses", () => {
    const state = createInitialState();
    const plane = holdingArrival(state);
    const runway = state.runways[0];

    const cleared = clear(state, plane.id, runway.id);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;

    const later = tick(cleared.state, SEPARATION_MS + 1);
    const done = later.planes.find((p) => p.id === plane.id)!;
    expect(done.phase).toBe("gate"); // arrival has landed and taxied in
    const freed = later.runways.find((r) => r.id === runway.id)!;
    expect(isRunwayFree(freed, later.t)).toBe(true);
  });
});

describe("sequencer: who goes next (the decision)", () => {
  it("recommends the lowest-fuel holding arrival first", () => {
    // Fixture: QF12 (fuel 8) and VA88 (fuel 20) both holding.
    const rec = recommend(createInitialState());
    expect(rec?.flight).toBe("QF12");
    expect(rec?.rule).toBe("low-fuel");
    expect(rec?.runwayId).toBeTruthy();
  });

  it("an emergency jumps ahead of a lower-fuel holding arrival", () => {
    // Drain enough that QF12 (8s) declares an emergency but VA88 (20s) does not.
    const state = tick(createInitialState(), 10_000);
    const emergency = state.planes.find((p) => p.phase === "emergency");
    expect(emergency).toBeTruthy();
    const rec = recommend(state);
    expect(rec?.planeId).toBe(emergency!.id);
    expect(rec?.rule).toBe("emergency");
  });

  it("recommends a departure only when no arrivals are waiting", () => {
    // A single departure at a gate, nothing holding.
    const base: SimState = {
      t: 0,
      planes: [
        { id: "d1", flight: "JQ5", kind: "departure", phase: "gate", fuel: 20, runwayId: null },
      ],
      runways: [{ id: "27", busyUntil: 0 }],
    };
    const rec = recommend(base);
    expect(rec?.flight).toBe("JQ5");
    expect(rec?.rule).toBe("departure");
  });

  it("recommends holding when every runway is inside its separation gap", () => {
    const base: SimState = {
      t: 1000,
      planes: [
        { id: "a1", flight: "QF12", kind: "arrival", phase: "holding", fuel: 5, runwayId: null },
      ],
      runways: [{ id: "27", busyUntil: 9000 }],
    };
    const rec = recommend(base);
    expect(rec?.rule).toBe("hold");
    expect(rec?.runwayId).toBeNull();
  });

  it("returns null when nothing is waiting for a runway", () => {
    const base: SimState = { t: 0, planes: [], runways: [{ id: "27", busyUntil: 0 }] };
    expect(recommend(base)).toBeNull();
  });
});

describe("sequencer: adding and removing planes", () => {
  it("addPlane adds a holding arrival", () => {
    const state = createInitialState();
    const before = state.planes.length;
    const next = addPlane(state);
    expect(next.planes.length).toBe(before + 1);
    const added = next.planes[next.planes.length - 1];
    expect(added.phase).toBe("holding");
    expect(added.kind).toBe("arrival");
  });

  it("removePlane removes the named plane", () => {
    const state = createInitialState();
    const target = state.planes[0].id;
    const next = removePlane(state, target);
    expect(next.planes.some((p) => p.id === target)).toBe(false);
    expect(next.planes.length).toBe(state.planes.length - 1);
  });
});

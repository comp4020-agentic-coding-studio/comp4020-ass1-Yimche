import { describe, expect, it } from "vitest";
import {
  boardFor,
  PHASES,
  PLANES,
  planeBlurb,
  SCENARIO,
  sceneAt,
  statusLabel,
  type Phase,
} from "../src/scripts/scenario";

// The core interaction is now a guided, scripted demo: the tower directs a fixed
// sequence of planes and the visitor watches, steps, and reads why each call is
// made. These assert the scenario data and the pure derivation the view draws,
// independent of how it is rendered, so they survive a restyle.

describe("scenario data", () => {
  it("has a run of beats to play through", () => {
    expect(SCENARIO.length).toBeGreaterThanOrEqual(6);
  });

  it("poses every plane on every beat, with a valid phase", () => {
    for (const beat of SCENARIO) {
      for (const plane of PLANES) {
        const pose = beat.poses[plane.id];
        expect(pose, `${plane.id} missing a pose on a beat`).toBeTruthy();
        expect(Number.isFinite(pose!.x)).toBe(true);
        expect(Number.isFinite(pose!.y)).toBe(true);
        expect(PHASES).toContain(pose!.phase);
      }
    }
  });

  it("narrates every beat and only directs known planes", () => {
    const ids = new Set(PLANES.map((p) => p.id));
    for (const beat of SCENARIO) {
      expect(beat.callout.trim().length).toBeGreaterThan(0);
      if (beat.directing !== null) {
        expect(ids.has(beat.directing)).toBe(true);
      }
    }
  });
});

describe("the scripted flow teaches the point", () => {
  it("takes an arrival from holding all the way to the gate", () => {
    const p1 = "p1";
    expect(SCENARIO[0]!.poses[p1]!.phase).toBe("holding");
    const phases = SCENARIO.map((b) => b.poses[p1]!.phase);
    expect(phases).toContain("landing");
    expect(phases).toContain("gate");
  });

  it("only launches the departure once no arrival is holding", () => {
    // The beat that first puts the departure on the runway must have no arrival
    // still holding: arrivals come first, departures take the gaps.
    const launch = SCENARIO.findIndex((b) => b.poses["p3"]!.phase === "departing");
    expect(launch).toBeGreaterThan(0);
    const holdingArrivals = PLANES.filter(
      (p) => p.kind === "arrival" && SCENARIO[launch]!.poses[p.id]!.phase === "holding",
    );
    expect(holdingArrivals).toHaveLength(0);
  });

  it("gets the departure airborne and gone", () => {
    const phases = SCENARIO.map((b) => b.poses["p3"]!.phase);
    expect(phases).toContain("gone");
  });
});

describe("sceneAt: pure derivation the view draws", () => {
  it("matches the keyframe exactly at progress 0", () => {
    const s = sceneAt(0, 0);
    for (const plane of s.planes) {
      const pose = SCENARIO[0]!.poses[plane.id]!;
      expect(plane.x).toBeCloseTo(pose.x);
      expect(plane.y).toBeCloseTo(pose.y);
    }
    expect(s.callout).toBe(SCENARIO[0]!.callout);
    expect(s.beatIndex).toBe(0);
  });

  it("interpolates position between two beats", () => {
    const a = SCENARIO[0]!.poses["p1"]!;
    const b = SCENARIO[1]!.poses["p1"]!;
    const mid = sceneAt(0, 0.5).planes.find((p) => p.id === "p1")!;
    expect(mid.x).toBeCloseTo((a.x + b.x) / 2);
    expect(mid.y).toBeCloseTo((a.y + b.y) / 2);
  });

  it("wraps the beat index around the loop", () => {
    const last = SCENARIO.length - 1;
    expect(sceneAt(SCENARIO.length, 0).beatIndex).toBe(0);
    expect(sceneAt(last, 0).beatIndex).toBe(last);
  });

  it("is pure: same inputs, same output", () => {
    expect(sceneAt(2, 0.3)).toEqual(sceneAt(2, 0.3));
  });

  it("flags the directed plane", () => {
    const directingBeat = SCENARIO.findIndex((b) => b.directing !== null);
    const s = sceneAt(directingBeat, 0);
    const flagged = s.planes.filter((p) => p.directing);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.id).toBe(SCENARIO[directingBeat]!.directing);
  });
});

describe("board + blurbs", () => {
  it("splits the board into arrivals and takeoff by kind", () => {
    const { arrivals, takeoff } = boardFor(sceneAt(0, 0));
    expect(arrivals.every((r) => PLANES.find((p) => p.id === r.id)?.kind === "arrival")).toBe(true);
    expect(takeoff.every((r) => PLANES.find((p) => p.id === r.id)?.kind === "departure")).toBe(true);
    expect(arrivals.length + takeoff.length).toBe(PLANES.length);
  });

  it("labels every phase and blurbs every plane", () => {
    for (const phase of PHASES as Phase[]) {
      expect(statusLabel(phase).trim().length).toBeGreaterThan(0);
    }
    const s = sceneAt(0, 0);
    for (const plane of s.planes) {
      expect(planeBlurb(plane.id, s).trim().length).toBeGreaterThan(0);
    }
  });
});

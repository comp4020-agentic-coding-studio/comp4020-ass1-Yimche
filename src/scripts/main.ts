// DOM wiring for the airport view. All sequencing logic lives in sequencer.ts;
// this file only turns SimState into pixels and turns clicks back into calls.
// State lives here (not in the layout), so it survives a window resize.
import {
  addPlane,
  clear,
  createInitialState,
  isRunwayFree,
  removePlane,
  START_FUEL,
  tick,
  type Phase,
  type Plane,
  type SimState,
} from "./sequencer";

const $ = <T extends HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

const planesLayer = $("#planes");
const board = $<HTMLUListElement>("#board");
const boardEmpty = $("#board-empty");
const statLanded = $("#stat-landed");
const statDeparted = $("#stat-departed");
const statEmergency = $("#stat-emergency");
const runwayEls = Array.from(
  document.querySelectorAll<HTMLElement>(".runway"),
);
const runwayIds = runwayEls.map((el) => el.dataset.runway ?? "");

// Guard: if the scene markup isn't present, do nothing rather than throw.
if (planesLayer && board) {
  let state: SimState = createInitialState();
  let paused = false;
  let last = performance.now();

  const counted = { landed: new Set<string>(), departed: new Set<string>(), emergency: new Set<string>() };
  let landed = 0;
  let departed = 0;
  let emergencies = 0;

  const PHASE_LABEL: Record<Phase, string> = {
    holding: "Holding",
    runway: "On runway",
    gate: "At gate",
    departed: "Departed",
    emergency: "FUEL EMERGENCY",
    diverted: "Diverted",
  };

  // Track completions and prune finished planes so the board doesn't grow
  // without bound. Kept out of the pure model on purpose.
  function reconcile(): void {
    for (const p of state.planes) {
      if (p.phase === "emergency" && !counted.emergency.has(p.id)) {
        counted.emergency.add(p.id);
        emergencies += 1;
      }
      if (p.kind === "arrival" && p.phase === "gate" && !counted.landed.has(p.id)) {
        counted.landed.add(p.id);
        landed += 1;
      }
      if (p.phase === "departed" && !counted.departed.has(p.id)) {
        counted.departed.add(p.id);
        departed += 1;
      }
    }
    // Depart planes fly off screen; drop them a beat later. Landed arrivals
    // linger at the gate but we cap how many pile up.
    const gateArrivals = state.planes.filter(
      (p) => p.kind === "arrival" && p.phase === "gate",
    );
    const drop = new Set(
      gateArrivals.slice(0, Math.max(0, gateArrivals.length - 3)).map((p) => p.id),
    );
    state = {
      ...state,
      planes: state.planes.filter(
        (p) => p.phase !== "departed" && !drop.has(p.id),
      ),
    };
  }

  // --- positioning ------------------------------------------------------
  const laneTop = (lane: number): number => 74 + lane * 11; // %

  function position(plane: Plane, holdIndex: number): { left: number; top: number } {
    switch (plane.phase) {
      case "holding": {
        const col = holdIndex % 3;
        const row = Math.floor(holdIndex / 3);
        return { left: 30 + col * 16, top: 8 + row * 13 };
      }
      case "emergency":
        return { left: 46, top: 6 };
      case "runway": {
        const lane = Math.max(0, runwayIds.indexOf(plane.runwayId ?? ""));
        return { left: 44, top: laneTop(lane) };
      }
      case "gate":
        return { left: plane.kind === "arrival" ? 87 : 80, top: 70 };
      case "departed":
        return { left: 104, top: -12 };
      default:
        return { left: 50, top: 50 };
    }
  }

  const planeSvg = `<svg viewBox="0 0 24 12" aria-hidden="true"><polygon points="0,6 15,4 22,5 23,6 22,7 15,8" /><polygon points="9,5 14,0 16,5" /><polygon points="9,7 14,12 16,7" /></svg>`;

  // --- render -----------------------------------------------------------
  function render(): void {
    // planes
    const holding = state.planes.filter((p) => p.phase === "holding");
    const holdIndex = new Map<string, number>();
    holding.forEach((p, i) => holdIndex.set(p.id, i));

    const seen = new Set<string>();
    for (const plane of state.planes) {
      seen.add(plane.id);
      let el = planesLayer!.querySelector<HTMLElement>(`[data-plane="${plane.id}"]`);
      if (!el) {
        el = document.createElement("div");
        el.className = "plane";
        el.dataset.plane = plane.id;
        el.innerHTML = `${planeSvg}<span class="tag"></span>`;
        planesLayer!.appendChild(el);
      }
      const { left, top } = position(plane, holdIndex.get(plane.id) ?? 0);
      el.style.left = `${left}%`;
      el.style.top = `${top}%`;
      el.dataset.phase = plane.phase;
      el.classList.toggle("low", plane.kind === "arrival" && plane.fuel <= START_FUEL * 0.35);
      el.querySelector(".tag")!.textContent = plane.flight;
    }
    for (const el of Array.from(planesLayer!.children)) {
      const id = (el as HTMLElement).dataset.plane;
      if (id && !seen.has(id)) el.remove();
    }

    // runway occupancy
    runwayEls.forEach((el) => {
      const rid = el.dataset.runway ?? "";
      const rw = state.runways.find((r) => r.id === rid);
      const busy = rw ? !isRunwayFree(rw, state.t) : false;
      el.classList.toggle("occupied", busy);
    });

    renderBoard();

    if (statLanded) statLanded.textContent = `Landed ${landed}`;
    if (statDeparted) statDeparted.textContent = `Departed ${departed}`;
    if (statEmergency) statEmergency.textContent = `Emergencies ${emergencies}`;
  }

  function renderBoard(): void {
    const active = state.planes.filter((p) => p.phase !== "departed");
    if (boardEmpty) boardEmpty.hidden = active.length !== 0;
    board!.replaceChildren();

    // waiting/urgent first, then whatever is in motion
    const order = (p: Plane): number =>
      p.phase === "emergency" ? 0 : p.phase === "holding" || (p.kind === "departure" && p.phase === "gate") ? 1 : 2;
    active.sort((a, b) => order(a) - order(b));

    for (const plane of active) {
      const li = document.createElement("li");
      li.className = "strip";
      li.dataset.plane = plane.id;
      li.dataset.phase = plane.phase;

      const clearable = (plane.kind === "arrival" && (plane.phase === "holding" || plane.phase === "emergency")) || (plane.kind === "departure" && plane.phase === "gate");
      const verb = plane.kind === "arrival" ? "Land on" : "Depart";

      const head = document.createElement("div");
      head.className = "strip-head";
      head.innerHTML = `<span class="flight">${plane.flight}</span><span class="kind ${plane.kind}">${plane.kind}</span><span class="phase">${PHASE_LABEL[plane.phase]}</span>`;
      li.appendChild(head);

      if (plane.kind === "arrival" && (plane.phase === "holding" || plane.phase === "emergency")) {
        const pct = Math.max(0, Math.min(100, (plane.fuel / START_FUEL) * 100));
        const fuel = document.createElement("div");
        fuel.className = "fuel";
        fuel.innerHTML = `<span class="fuel-label">fuel</span><span class="fuel-bar"><span style="width:${pct}%"></span></span>`;
        li.appendChild(fuel);
      }

      const actions = document.createElement("div");
      actions.className = "strip-actions";
      if (clearable) {
        for (const rid of runwayIds) {
          const rw = state.runways.find((r) => r.id === rid);
          const free = rw ? isRunwayFree(rw, state.t) : false;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = `${verb} ${rid}`;
          btn.disabled = !free;
          btn.addEventListener("click", () => {
            const r = clear(state, plane.id, rid);
            if (r.ok) {
              state = r.state;
              render();
            }
          });
          actions.appendChild(btn);
        }
      }
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove";
      rm.textContent = "✕";
      rm.setAttribute("aria-label", `Remove ${plane.flight}`);
      rm.addEventListener("click", () => {
        state = removePlane(state, plane.id);
        render();
      });
      actions.appendChild(rm);
      li.appendChild(actions);
      board!.appendChild(li);
    }
  }

  // --- loop -------------------------------------------------------------
  function frame(now: number): void {
    const dt = Math.min(250, now - last);
    last = now;
    if (!paused) {
      state = tick(state, dt);
      reconcile();
      render();
    }
    requestAnimationFrame(frame);
  }

  // --- controls ---------------------------------------------------------
  $("#add-arrival")?.addEventListener("click", () => {
    state = addPlane(state);
    render();
  });
  $("#add-departure")?.addEventListener("click", () => {
    state = addPlane(state, { kind: "departure", phase: "gate", fuel: START_FUEL });
    render();
  });
  $("#reset")?.addEventListener("click", () => {
    state = createInitialState();
    landed = departed = emergencies = 0;
    counted.landed.clear();
    counted.departed.clear();
    counted.emergency.clear();
    planesLayer!.replaceChildren();
    render();
  });
  const pauseBtn = $<HTMLButtonElement>("#pause");
  pauseBtn?.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    pauseBtn.setAttribute("aria-pressed", String(paused));
    if (!paused) last = performance.now();
  });

  render();
  requestAnimationFrame(frame);
}

export {}; // keep this a module even after tree-shaking

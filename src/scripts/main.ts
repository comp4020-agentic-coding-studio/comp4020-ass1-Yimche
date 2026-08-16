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

// M2 sky-map layers (top-down view). Drawn into SVG groups by renderMap().
const SVGNS = "http://www.w3.org/2000/svg";
const mapPlanes = document.getElementById("map-planes");
const mapTrails = document.getElementById("map-trails");
const airportView = document.getElementById("view-airport");
const mapView = document.getElementById("view-map");

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

    renderMap();
  }

  // --- sky map (top-down) ----------------------------------------------
  // Positions and trails are derived here, in the view layer, so the pure
  // sequencer contract stays untouched: the map is just a second drawing of
  // the same SimState.
  const MAP_FIX = { x: 76, y: 26 };
  const trails = new Map<string, { x: number; y: number }[]>();
  let trailAt = -Infinity; // last sim-time (ms) a trail point was sampled

  function mapPosition(
    plane: Plane,
    holdIndex: number,
    holdCount: number,
  ): { x: number; y: number } {
    switch (plane.phase) {
      case "holding": {
        // Circle the holding fix; fan planes around the ring and rotate slowly.
        const ring = 5 + (holdIndex % 3) * 3;
        const base = holdCount > 0 ? (holdIndex / holdCount) * Math.PI * 2 : 0;
        const a = base + state.t / 3600;
        return { x: MAP_FIX.x + Math.cos(a) * ring, y: MAP_FIX.y + Math.sin(a) * ring };
      }
      case "emergency":
        // Broken off the hold, running straight for the field.
        return { x: 64, y: 41 };
      case "runway": {
        const lane = Math.max(0, runwayIds.indexOf(plane.runwayId ?? ""));
        return lane === 0 ? { x: 44, y: 58 } : { x: 50, y: 52 };
      }
      case "gate":
        return { x: 50, y: 64 };
      default:
        return { x: 50, y: 58 };
    }
  }

  function renderMap(): void {
    if (!mapPlanes || !mapTrails) return;
    const holding = state.planes.filter((p) => p.phase === "holding");
    const holdIndex = new Map<string, number>();
    holding.forEach((p, i) => holdIndex.set(p.id, i));

    // Sample trails on a sim-time cadence so the track doesn't depend on the
    // frame rate or how long the map tab happened to be open.
    const sample = state.t - trailAt >= 400;
    if (sample) trailAt = state.t;

    const seen = new Set<string>();
    for (const plane of state.planes) {
      if (plane.phase === "departed") continue;
      seen.add(plane.id);
      const pos = mapPosition(plane, holdIndex.get(plane.id) ?? 0, holding.length);

      const pts = trails.get(plane.id) ?? [];
      if (sample || pts.length === 0) {
        pts.push(pos);
        while (pts.length > 24) pts.shift();
        trails.set(plane.id, pts);
      }

      let g = mapPlanes.querySelector<SVGGElement>(`[data-map-plane="${plane.id}"]`);
      if (!g) {
        g = document.createElementNS(SVGNS, "g") as SVGGElement;
        g.setAttribute("data-map-plane", plane.id);
        const dot = document.createElementNS(SVGNS, "circle");
        dot.setAttribute("r", "1.8");
        dot.setAttribute("class", "map-dot");
        const label = document.createElementNS(SVGNS, "text");
        label.setAttribute("class", "map-flight");
        g.append(dot, label);
        mapPlanes.appendChild(g);
      }
      const dot = g.firstChild as SVGCircleElement;
      const label = g.lastChild as SVGTextElement;
      dot.setAttribute("cx", pos.x.toFixed(1));
      dot.setAttribute("cy", pos.y.toFixed(1));
      label.setAttribute("x", (pos.x + 2.4).toFixed(1));
      label.setAttribute("y", (pos.y + 0.8).toFixed(1));
      label.textContent = plane.flight;
      g.setAttribute("data-phase", plane.phase);
      g.classList.toggle(
        "low",
        plane.kind === "arrival" && plane.fuel <= START_FUEL * 0.35,
      );
    }

    for (const [id, pts] of trails) {
      if (!seen.has(id)) continue;
      let pl = mapTrails.querySelector<SVGPolylineElement>(`[data-map-trail="${id}"]`);
      if (!pl) {
        pl = document.createElementNS(SVGNS, "polyline") as SVGPolylineElement;
        pl.setAttribute("data-map-trail", id);
        pl.setAttribute("class", "map-trail");
        mapTrails.appendChild(pl);
      }
      pl.setAttribute("points", pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
    }

    for (const el of Array.from(mapPlanes.children)) {
      const id = el.getAttribute("data-map-plane");
      if (id && !seen.has(id)) el.remove();
    }
    for (const el of Array.from(mapTrails.children)) {
      const id = el.getAttribute("data-map-trail");
      if (id && !seen.has(id)) {
        el.remove();
        trails.delete(id);
      }
    }
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
    trails.clear();
    trailAt = -Infinity;
    mapPlanes?.replaceChildren();
    mapTrails?.replaceChildren();
    render();
  });
  const pauseBtn = $<HTMLButtonElement>("#pause");
  pauseBtn?.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    pauseBtn.setAttribute("aria-pressed", String(paused));
    if (!paused) last = performance.now();
  });

  // --- view switch ------------------------------------------------------
  const towerBtn = $<HTMLButtonElement>("#view-tower-btn");
  const mapBtn = $<HTMLButtonElement>("#view-map-btn");
  function showView(name: "airport" | "map"): void {
    if (airportView) airportView.hidden = name !== "airport";
    if (mapView) mapView.hidden = name !== "map";
    towerBtn?.setAttribute("aria-current", String(name === "airport"));
    mapBtn?.setAttribute("aria-current", String(name === "map"));
    if (name === "map") renderMap();
  }
  towerBtn?.addEventListener("click", () => showView("airport"));
  mapBtn?.addEventListener("click", () => showView("map"));
  $("#sky-to-map")?.addEventListener("click", () => showView("map"));

  render();
  requestAnimationFrame(frame);
}

export {}; // keep this a module even after tree-shaking

// DOM wiring for the scripted airport demo. All choreography lives in
// scenario.ts as pure data plus pure derivation; this file turns a SceneState
// into pixels, runs the playback clock, and wires the popups. Playback state
// lives here (not in the layout) so it survives a window resize.
import {
  boardFor,
  planeBlurb,
  SCENARIO,
  sceneAt,
  statusLabel,
  type SceneState,
} from "./scenario";

const $ = <T extends HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

const planesLayer = $("#planes");
const boardArrivals = $<HTMLUListElement>("#board-arrivals");
const boardTakeoff = $<HTMLUListElement>("#board-takeoff");
const calloutEl = $("#callout");
const runwayEls = Array.from(document.querySelectorAll<HTMLElement>(".runway"));

// Guard: if the scene markup isn't present, do nothing rather than throw.
if (planesLayer && SCENARIO.length > 0) {
  const BEAT_MS = 2600; // real milliseconds per beat at 1x
  const SPEEDS = [1, 2, 4];
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  let beat = 0;
  let progress = 0; // 0..1 through the current beat
  let playing = !reduce; // respect reduced-motion: start paused
  let speedIndex = 0;
  let last = performance.now();

  // Top-down jet pointing up (nose toward the terminal), drawn in three tones
  // so it reads as a solid model rather than a flat sticker: wings/tail behind,
  // fuselage on top, a centre highlight for a lit edge.
  const planeSvg = `<svg viewBox="0 0 40 48" aria-hidden="true"><polygon class="plane-wing" points="16,20 1,33 1,36 16,27" /><polygon class="plane-wing" points="24,20 39,33 39,36 24,27" /><polygon class="plane-wing" points="16,40 8,46 8,47 16,43" /><polygon class="plane-wing" points="24,40 32,46 32,47 24,43" /><polygon class="plane-body" points="20,2 24,15 23,42 20,46 17,42 16,15" /><polygon class="plane-hi" points="20,5 21.4,15 21,39 20,42 19,39 18.6,15" /></svg>`;

  // --- render -----------------------------------------------------------
  function render(state: SceneState): void {
    // planes
    for (const plane of state.planes) {
      let el = planesLayer!.querySelector<HTMLButtonElement>(`[data-plane="${plane.id}"]`);
      if (!el) {
        el = document.createElement("button");
        el.type = "button";
        el.className = "plane";
        el.dataset.plane = plane.id;
        el.dataset.kind = plane.kind;
        el.innerHTML = `${planeSvg}<span class="plane-tag"></span>`;
        el.addEventListener("click", () => openPlane(plane.id));
        planesLayer!.appendChild(el);
      }
      el.style.left = `${plane.x}%`;
      el.style.top = `${plane.y}%`;
      // rotate the jet to face its direction of travel; the var drives the SVG
      // so it never fights the drift animation on the button's own transform.
      el.style.setProperty("--rot", `${plane.angle}deg`);
      el.dataset.phase = plane.phase;
      el.classList.toggle("directing", plane.directing);
      el.querySelector(".plane-tag")!.textContent = plane.name;
      el.setAttribute(
        "aria-label",
        `${plane.name}, ${statusLabel(plane.phase).toLowerCase()}. Open details.`,
      );
    }

    // runway is "busy" while a plane is on it
    const busy = state.planes.some(
      (p) => p.phase === "landing" || p.phase === "departing",
    );
    for (const el of runwayEls) el.classList.toggle("occupied", busy);

    renderBoard(state);
    if (calloutEl) calloutEl.textContent = state.callout;
  }

  function renderBoard(state: SceneState): void {
    const { arrivals, takeoff } = boardFor(state);
    const fill = (ul: HTMLUListElement | null, rows: typeof arrivals): void => {
      if (!ul) return;
      ul.replaceChildren();
      for (const row of rows) {
        const li = document.createElement("li");
        li.className = "board-row";
        li.innerHTML = `<span class="board-name">${row.name}</span><span class="board-status">${row.status}</span>`;
        ul.appendChild(li);
      }
    };
    fill(boardArrivals, arrivals);
    fill(boardTakeoff, takeoff);
  }

  // --- playback clock ---------------------------------------------------
  function frame(now: number): void {
    const dt = Math.min(100, now - last);
    last = now;
    if (playing) {
      progress += (dt * SPEEDS[speedIndex]!) / BEAT_MS;
      while (progress >= 1) {
        progress -= 1;
        beat = (beat + 1) % SCENARIO.length;
      }
      render(sceneAt(beat, progress));
    }
    requestAnimationFrame(frame);
  }

  // --- controls ---------------------------------------------------------
  const playBtn = $<HTMLButtonElement>("#play");
  function setPlaying(next: boolean): void {
    playing = next;
    if (playBtn) {
      playBtn.textContent = playing ? "Pause" : "Play";
      playBtn.setAttribute("aria-pressed", String(playing));
    }
    if (playing) last = performance.now();
  }
  playBtn?.addEventListener("click", () => setPlaying(!playing));

  $("#step")?.addEventListener("click", () => {
    setPlaying(false);
    progress = 0;
    beat = (beat + 1) % SCENARIO.length;
    render(sceneAt(beat, progress));
  });

  $("#reset")?.addEventListener("click", () => {
    beat = 0;
    progress = 0;
    render(sceneAt(beat, progress));
  });

  const speedBtn = $<HTMLButtonElement>("#speed");
  speedBtn?.addEventListener("click", () => {
    speedIndex = (speedIndex + 1) % SPEEDS.length;
    if (speedBtn) speedBtn.textContent = `${SPEEDS[speedIndex]}×`;
  });

  // --- popups -----------------------------------------------------------
  let openEl: HTMLElement | null = null;
  let opener: HTMLElement | null = null;
  let wasPlaying = false;

  function openPopup(id: string, trigger: HTMLElement | null): void {
    const popup = document.getElementById(id);
    if (!popup) return;
    openEl = popup;
    opener = trigger;
    wasPlaying = playing;
    setPlaying(false); // freeze the scene while the popup is up
    popup.hidden = false;
    trigger?.setAttribute("aria-current", "true");
    popup.querySelector<HTMLButtonElement>(".popup-close")?.focus();
  }

  function closePopup(): void {
    if (!openEl) return;
    openEl.hidden = true;
    opener?.removeAttribute("aria-current");
    opener?.focus();
    openEl = null;
    opener = null;
    if (wasPlaying) setPlaying(true);
  }

  function openPlane(planeId: string): void {
    const state = sceneAt(beat, progress);
    const plane = state.planes.find((p) => p.id === planeId);
    const title = document.getElementById("popup-plane-title");
    const body = document.getElementById("popup-plane-body");
    if (title && plane) title.textContent = plane.name;
    if (body) body.textContent = planeBlurb(planeId, state);
    const trigger = planesLayer!.querySelector<HTMLElement>(`[data-plane="${planeId}"]`);
    openPopup("popup-plane", trigger);
  }

  $("#open-gate")?.addEventListener("click", (e) => openPopup("popup-gate", e.currentTarget as HTMLElement));
  $("#open-tower")?.addEventListener("click", (e) => openPopup("popup-tower", e.currentTarget as HTMLElement));

  for (const el of document.querySelectorAll<HTMLElement>("[data-close]")) {
    el.addEventListener("click", closePopup);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openEl) closePopup();
  });

  // --- go ---------------------------------------------------------------
  setPlaying(playing);
  render(sceneAt(beat, progress));
  requestAnimationFrame(frame);
}

export {}; // keep this a module even after tree-shaking

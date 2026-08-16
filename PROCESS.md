# Process overview

A reading-guide to how this prototype came together, and where the judgement
sits. The links go straight to the commits that carry the evidence.

## What I built

An interactive explainer of how air traffic control sequences a scarce runway:
one runway serves one plane at a time, holding arrivals burn fuel, and a plane
already in the air comes before a departure waiting at the gate. It is one
full-screen airport scene in light green and white, diagrammatic in the spirit
of the elevator explainer at john.fun/elevators. A short scripted choreography
loops through a few planes being directed; a board tracks arrivals and takeoff,
a tower callout narrates each call, and popups on the gate, the tower, and any
plane explain what is happening and why. Play, step, reset and a speed toggle
hand the visitor the clock.

## The moments that mattered

**A pure model before any pixels.** The first thing I built was not a screen but
a DOM-free module with its core-interaction contract written as failing tests
first, then made to pass. Writing the contract before the code is what told me
the mechanics were right independently of any view. That model was later cut
(see the pivot below), but the habit carried straight into the scripted version,
which is again pure data plus pure derivation with the view as a thin redraw.
[`eedd1d6...02c8617`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/compare/eedd1d6...02c8617)

**A contradiction in the harness, fixed in the harness.** My `AGENTS.md` said
"never commit a red state", but the course wants the red-to-green history as
process evidence, and I needed to commit a failing spec test first. I added a
documented carve-out instead of re-prompting around it — test-first reds may be
committed, nothing else red may. It earned its keep twice: the scripted rewrite
also began with a scenario contract committed red on purpose, then turned green
when I authored the beats.
[`aff9bff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/aff9bff),
[`c55e5f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/c55e5f0)

**Wiring the sensor the roster was missing.** `pnpm check` runs typecheck,
build, oxlint, stylelint and vitest, but nothing watched accessibility. I added
a JSDOM contract against the built page: every control is a real `<button>` with
an accessible name, and no clicks are wired onto non-interactive elements. It
still guards the shipped page — the play/step/reset controls and the
gate/tower/plane triggers would all fail the build if one became a clickable
`<div>`.
[`7d3acd4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/7d3acd4)

**Cutting the simulation to a scripted demo, on feedback.** The first build was a
working simulation: three views and a `recommend()` ranking of who goes next.
Looking at it, I judged it heavier than the brief needed and harder to read than
the elevator explainer it was measured against. So I cut it — dropped the dark
palette for light green and white, replaced the sim with a pure scripted
scenario, rewrote the interaction contract for a guided walkthrough rather than
manual controls, and landed the immersive scene with its gate, tower and plane
popups. Removing working code to answer a critique was the harder call than
writing it.
[`f726118`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/f726118),
[`3a75311`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/3a75311),
[`6605839`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/6605839)

## Before you ship

`pnpm check` is green (34 tests) and `pnpm check:evidence` resolves every
citation above. The deployed page is verified live at 1920×1080 and 390×844.

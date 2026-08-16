# Process overview

A reading-guide to how this prototype came together, and where the judgement
sits. The links go straight to the commits that carry the evidence.

## What I built

An interactive explainer of how air traffic control sequences a scarce runway:
one runway serves one plane at a time, holding arrivals burn fuel, and that
single bottleneck is the whole decision. The visitor is the controller, clearing
planes onto runways and watching who has to keep circling. It has three views of
one simulation: a side-on tower, a top-down sky map, and an inside-ATC screen
that explains each call.

## The moments that mattered

**Scoping three views into one tested model.** The brief I set myself asked for
three separate views ("a 2D side-on view... a map... the inside of the ATC").
The obvious move was to build all three at once. Instead I pulled the mechanics
into a pure module with no DOM, wrote the core-interaction contract as failing
tests first, then made them pass — single-runway occupancy, separation
rejection, monotonic fuel burn, emergency at empty. Writing the contract before
the code is what told me the model was right independently of any view; the three
views then became three drawings of the same tested state.
[`eedd1d6...02c8617`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/compare/eedd1d6...02c8617)

**A contradiction in the harness, fixed in the harness.** My `AGENTS.md` said
"never commit a red state", but the course wants the red-to-green history as
process evidence, and I genuinely needed to commit a failing spec test first.
Re-prompting around it would have hidden the tension rather than resolving it. I
added a documented carve-out instead — test-first reds may be committed, nothing
else red may — so the rule and the evidence stopped fighting. Landing the
correction in the operating rules, not in another prompt, is what made it stick.
[`aff9bff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/aff9bff)

**Wiring the sensor the roster was missing.** `pnpm check` runs typecheck, build,
oxlint, stylelint and vitest, but nothing watched accessibility. Rather than
eyeball it, I added a JSDOM contract against the built page: every control is a
real `<button>` with an accessible name, and no clicks are wired onto
non-interactive elements. That check now fails the build if a later view reaches
for a clickable `<div>` — which is exactly what kept the sky and tower click
targets as real buttons with `aria-label`s.
[`7d3acd4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/7d3acd4)

**The decision as a pure function, verified against the render.** The point of
the explainer is *who goes next and why*, so I made that a pure `recommend()` —
emergency, then lowest fuel, then departures — with five tests, and the
inside-ATC view simply reads it. The map and ATC views therefore touch the model
not at all; they are redraws. I checked the whole loop in headless Chromium over
CDP rather than trusting my mental model: clearing the recommended plane really
did lock the runway and advance the call to the next-lowest tank.
[`53170ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/53170ff),
[`90a8882...a2d8aa8`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/compare/90a8882...a2d8aa8)

## Before you ship

`pnpm check` is green (33 tests) and `pnpm check:evidence` resolves every
citation above. The deployed page is verified live at 1920×1080 and 390×844.

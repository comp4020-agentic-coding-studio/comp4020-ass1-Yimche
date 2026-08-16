# Process overview

A reading-guide to how this prototype came together, and where the judgement
sits. The links go straight to the commits that carry the evidence.

## What I built

An interactive explainer built on one idea: the great civilisations did not run
one after another. You scroll down a single axis spanning roughly five and a
half thousand years, from 3500 BCE to now, and twenty-two civilisations run past
as parallel bars in packed lanes, so their overlaps are the first thing you see.
A fixed readout names the year and era as you descend. Behind the bars sits a
faint world map, and focusing any civilisation (hover, keyboard focus, or opening
its popup) lights its place on that map and branches from its birth-year node to
the birth-year nodes of the civilisations it grew from, gave rise to, influenced,
or fought, dimming the rest. Each node is a circular medallion carrying that
civilisation's architecture. The page answers three questions at once: when,
where, and how they relate.

## The moments that mattered

**A pure model before any pixels.** The first thing I built on the original
project was not a screen but a DOM-free module with its core-interaction contract
written as failing tests first, then made to pass. Writing the contract before
the code is what told me the mechanics were right independently of any view.
[`eedd1d6...02c8617`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/compare/eedd1d6...02c8617)
That habit is the through-line: the timeline is again a pure model plus pure
derivation with the view as a thin render, first for the scale and lane packing,
[`5f70689`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/5f70689)
then for the map projection and relation graph.
[`712f420`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/712f420)

**A contradiction in the harness, fixed in the harness.** My `AGENTS.md` said
"never commit a red state", but the course wants the red-to-green history as
process evidence, and I needed to commit a failing spec test first. I added a
documented carve-out instead of re-prompting around it: test-first reds may be
committed on their own, nothing else red may.
[`aff9bff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/aff9bff)
It earned its keep on the timeline twice, once for the scale-and-lanes contract
and once for the geography-and-relations contract, each committed red on purpose
and turned green by the very next commits.
[`53910f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/53910f2),
[`dc5cd75`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/dc5cd75)

**Wiring the sensor the roster was missing.** `pnpm check` runs typecheck,
build, oxlint, stylelint and vitest, but nothing watched accessibility. I added
a JSDOM contract against the built page: every control is a real `<button>` with
an accessible name, and no clicks are wired onto non-interactive elements. It
still guards the shipped page, and it grew with it: the same check now covers the
civilisation bars and the clickable relation links in the popup.
[`7d3acd4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/7d3acd4)

**Cutting a finished prototype to answer the brief.** The original build was a
complete, working ATC explainer: a tested runway-sequencing model, an immersive
scripted scene, gate and tower and plane popups, a committed light palette. I
judged it a well-made answer to a weaker question, and started over on a topic
with more reach. Removing a whole shipped prototype was the harder call than
adding to it, and the commit that does it is the pivot the rest of the work hangs
from.
[`0ea78f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/0ea78f7)

**Layering where and how onto when, as one interaction.** The scrollable
timeline answered "when".
[`9354edf`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/9354edf)
On feedback I added two more dimensions rather than two more widgets: a faint,
self-authored world map so you can see where each civilisation developed,
[`f04a19b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/f04a19b)
and relation connectors that branch from a focused civilisation to the ones it
is tied to.
[`e3a16e0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/e3a16e0)
Testing on the page showed those branches diving into the centre of a tall bar,
which for a long-lived civilisation scrolls off-screen, so I re-anchored them to
each civilisation's birth-year node and made every node a circular medallion
carrying its architecture, drawn on focus.
[`80c63d7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/80c63d7)
Both hang off one gesture, focus, so the page stays a calm timeline until you
engage it. The map is hand-authored coarse coastlines run through the same
projection the pins and tests use, so it is licence-clean and its geometry is
verified by the same model, not eyeballed.

## Before you ship

`pnpm check` is green (54 tests) and `pnpm check:evidence` resolves every
citation above. The deployed page is verified live at 1920×1080 and 390×844,
including the focus highlight, the relation links, and keyboard open-and-close.

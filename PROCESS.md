# Process overview

A reading-guide to how this prototype came together, and where the judgement
sits. The links go straight to the commits that carry the evidence.

## What I built

An interactive explainer built on one idea: the great civilisations did not run
one after another. You scroll down a single axis from 3500 BCE to now, and sixty
civilisations run past as parallel bars packed into labelled column-groups, so
their overlaps are the first thing you see. Focusing any civilisation lights its
place on a faint world map and branches from its emblem to the ones it grew from,
gave rise to, influenced, or fought. The page answers when, where, and how they
relate, all on one gesture.

## The moments that mattered

**Cutting a finished prototype to answer the brief.** The first build was a
complete, working air-traffic-control explainer: a tested sequencing model, a
scripted scene, gate and tower popups. I judged it a well-made answer to a
narrow question and started over on one with more reach. Removing a whole shipped
prototype was the harder call than adding to it, and it is the pivot the rest of
the work hangs from.
[`0ea78f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/0ea78f7)

**Corrections that landed in the harness, not the prompt.** My `AGENTS.md` said
"never commit a red state", but the course wants the red-to-green history as
evidence. Rather than re-prompt around it, I added a documented carve-out: a
test-first red may be committed on its own, nothing else.
[`aff9bff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/aff9bff)
It paid for itself on the timeline twice, each contract committed red on purpose
and green the very next commit.
[`53910f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/53910f2),
[`dc5cd75`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/dc5cd75)
The same instinct made me wire the accessibility check the sensor roster was
missing instead of promising to remember it.
[`7d3acd4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/7d3acd4)

**Layering where and how onto when, corrected against the render.** The scrollable
timeline answered "when".
[`9354edf`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/9354edf)
On feedback I added two dimensions rather than two widgets: a self-authored world
map for "where",
[`f04a19b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/f04a19b)
and relation connectors for "how".
[`e3a16e0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/e3a16e0)
Watching the real page showed those branches diving into the centre of a tall bar
that scrolls off-screen, so I re-anchored them to each civilisation's birth-year
medallion, a thing only visible by scrolling and hovering myself.
[`80c63d7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/80c63d7)

**Fitting the two viewports the brief marks, by measuring first.** Sixty lanes
overflowed both marked viewports, so I measured the page before choosing: at 1920
all lanes fit if the inline labels give way, but at 390 they never will, though a
single group fits a phone. That split the fix by viewport rather than forcing one
compromise. Desktop fits to width and moves the label to a chip on focus,
[`a538c94`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/a538c94)
while the phone pages across the groups with a jump rail, its contract committed
red first.
[`413dbeb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/413dbeb),
[`8429083`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Yimche/commit/8429083)

## Before you ship

`pnpm check` is green (66 tests) and `pnpm check:evidence` resolves every
citation above. I verified the built page at 1920×1080 and 390×844: desktop fits
every lane with no horizontal scrollbar, the phone pages the groups from the
rail, and keyboard open-and-close and a mid-interaction resize both hold.

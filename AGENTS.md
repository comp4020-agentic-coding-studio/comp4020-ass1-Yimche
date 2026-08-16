# AGENTS.md

The working harness for this repo. These are standing rules for any agent (and
me) working here — read this before planning or building, and re-read it when a
check keeps catching you out. This file is also read as process evidence, so it
stays honest and current: when a correction belongs to *how the work is run*
rather than to one output, it lands here as a new rule, not in a retry.

> `CLAUDE.md` points at this file; keep the operating rules here so the two
> don't drift.

## What this is

An **interactive explainer**: one strong idea, one dataset or mechanic, and
nothing else. Static, client-side, deployed to GitHub Pages.

- **Topic:** How did we get here? The great civilisations did not run one after
  another; they overlapped in time, rose in different places, and grew out of
  one another. Seeing *when*, *where*, and *how they relate* together reframes
  history as a crowded, parallel, connected story rather than a relay.
- **The visitor does something** that changes what they see. It is not a page
  you only read.

Everything in scope serves that one idea. If a feature doesn't sharpen it, it's
out — over-scoping reads as an answer without a point of view.

## What's actually being marked

Optimise for these, in this order of weight:

1. **Legibility of process (45%).** A reader must see *how* the work was
   directed, grounded, and corrected. The top band is for *skilled* directing —
   failures diagnosed and fixed at the harness level, output verified before it
   was accepted, judgement visible in what was thrown away. Corroboration is the
   floor, not the ceiling.
2. **Response to the brief (35%).** A pointed, scoped answer with a point of
   view beats a polished but generic one.
3. **Working deployed artefact (20%).** The **deployed URL** is what's marked,
   at **1920×1080** and **390×844**, both in full. The top band holds up under
   use it wasn't designed for: keyboard, resize mid-interaction, slow
   connection.

Polish is not the lever this early. A rough-but-legible prototype with a real
idea scores well.

## The core interaction (state it testably)

Name the one thing the visitor does, plainly enough to write a test for it, and
back it with a `spec/*.test.ts`. If you can't write the test, the interaction
isn't defined yet.

- **Interaction:** Scrolling down the ~5,500-year axis drives a live year/era
  readout, past sixty civilisations packed into labelled, region-tinted
  column-groups; focusing a civilisation (hover, keyboard focus, or opening its
  popup) lights its place on the faint world map and branches from its
  birth-year node to the birth-year nodes of the civilisations it relates to,
  each node a circular medallion carrying its group's architecture, dimming the
  rest.
- **Testable claim:** The built page renders one focusable bar and one map pin
  per civilisation, a connector overlay, a birth-year node layer, an
  architecture icon per civilisation, and a popup relations section; the pure
  model packs the civilisations into disjoint group bands that tile the lanes,
  projects every civilisation inside the map bounds, and resolves each one's
  relations both ways (`spec/interaction.test.ts`, `spec/geo.test.ts`,
  `spec/timeline.test.ts`, `spec/grouping.test.ts`).

Keep this line and its test in sync with what the page actually does. A passing
test that describes an old behaviour is a lie in the harness.

## Hard constraints

- **Static and client-side only.** No server, no runtime backend, no secrets. If
  a build step needs a network call, that's a smell — stop and reconsider.
- **Both viewports count in full.** Verify desktop **and** phone every time the
  layout changes; don't assume one from the other.
- **GitHub Pages base path.** The site lives under `…github.io/<repo>/`. This
  template's Vite config uses relative asset URLs to sidestep the base-path trap;
  if you swap generators (e.g. Astro), set `base` explicitly. Getting it wrong
  looks fine locally while every asset 404s live — so the check that matters is
  a fresh `pnpm build` + link check against `./dist`, then the deployed URL.
  Don't hand-wire a stack swap; the course plugin's `stack` skill runs the
  tested conversion and handles this trap plus the CI link-check patch.
- **Commit `pnpm-lock.yaml`.** CI installs with `--frozen-lockfile`, so a
  dependency change that isn't reflected in the committed lockfile fails the
  build even though it works locally.
- **Keyboard and resize are part of "working."** The marker tabs through it and
  resizes mid-use. Interactive controls must be focusable and operable by
  keyboard, and state must survive a resize. Treat these as requirements even
  though no automated sensor catches them yet.
- **Never commit secrets.** No keys, tokens, or passwords in tracked files. The
  pre-commit hook is the sensor that matters; if something leaks, rotate it.

## The working loop

0. The shell here is **fish**, not bash. Scripts and compound commands must be
   fish-compatible, or invoked explicitly through `bash -c`.
1. Keep `pnpm dev` running; watch changes as you make them.
2. **Verify against the rendered page, not your mental model of it.** Use
   `agent-browser` to look at the real DOM/output before believing a change
   worked. The rendered page is the truth.
3. Before every push, run **`pnpm check`** (typecheck → build → lint → spec).
   For links, run `pnpm dlx linkinator ./dist --silent` against a fresh
   `pnpm build`.
4. **Commit when the checks pass. Never commit a red state** — with one
   deliberate exception: a *new spec test that encodes a contract not yet
   built* may be committed red, on its own, because the red→green transition is
   the process evidence the course reads (see the harness log). The rule
   protects the build, typecheck, lint, existing contracts, and the branch tip
   at ship time; it does not forbid intentional test-first reds. Small, frequent
   commits — the trail is the evidence.
5. Ship with time for CI to finish. "Still running" counts as not green at the
   cutoff.

## When a check goes red

- **Read the failure output before changing anything.** It names the file, the
  line, or the contract. It's an instruction, not noise.
- **Fix at the source, not the symptom.** A type error is the compiler telling
  you a claim in the code is false — make the claim true, don't cast it away.
- Treat red as authoritative: the page is wrong until the check is green, not
  until you decide it should be.
- If the same class of failure keeps recurring, the fix is a **new rule in this
  file or a new check** — see below.

## Sensors (the roster `pnpm check` runs)

`typecheck` · `build` · `deploy/online` · `spec` (invariants + your
`spec/*.test.ts`) · `lint` (stylelint, oxlint) · `tests` · `evidence`
(`check:evidence`) · `links` · `secrets`.

Nothing here measures **accessibility** or **performance** — those are
unwatched. Given the marker tabs and resizes, wiring at least a keyboard/axe
check is worth doing, and doing it counts as a harness correction.

## Process evidence (part of the mark, unseen by the checks)

- **Commit legibly and as you go.** A history that grew with the code is the
  strongest evidence; a night-before dump is the weakest.
- **`PROCESS.md`: 400–600 words, three or four moments — not more.** Each moment
  says what you did *instead of* the obvious thing, and how you knew the result
  was right. Cite each to a commit/range that resolves (`check:evidence`
  verifies this). The strongest moments are corrections that landed in the
  **harness** — a rule added here, a check wired up, an attempt thrown away —
  not retries.
- **Reflection: `reflections/assignment-1.md`.** The breakthrough that moved the
  work forward and what it changed about the developer you want to be. This is
  what you present at the week-4 retro; there's nothing to write twice. Due at
  the cutoff — no file, no shipped week.

## Harness log (grow this)

The gap between this boilerplate and your own version is part of the mark. When
you correct the work at the harness level, record the rule here so it holds next
time. Seed rules:

- Never use emdashes, "--" or any other AI-isms.
- **Test-first reds are allowed to be committed; nothing else red is.** The
  course wants the red→green of a spec test visible in history, but the branch
  tip must be green at the cutoff and CI must not be left red. So a new
  `spec/*.test.ts` that encodes a not-yet-built contract may be committed on its
  own while failing; the very next commits turn it green. This is the only red a
  commit may carry, and it never applies to the build, typecheck, lint, or an
  existing contract. (Reconciles the course `start` skill with step 4 above.)
- **Keep the harness in the repo, not in `~/.claude/`.** Config, skills,
  settings, and self-edits belong in this repo (`CLAUDE.md`, `AGENTS.md`,
  `.claude/`, `spec/`). Two reasons that both bite: the harness is process
  evidence a marker reads directly, and it must travel with the repo when it
  goes public. Global config is invisible to both.
- **One source of truth per fact.** `CLAUDE.md` is the map (what the repo is,
  where things live, a short set of critical reminders); this file is the
  operating harness. Detailed rules live here and only here. When they overlap,
  `CLAUDE.md` keeps the high-level version and this file keeps the detail, so
  the two can't drift.
- **Generalise the model before scaling the data.** When a change asks for
  "more and finer" (grouping the lanes, then growing 22 civilisations to 60),
  push the new structure through the pure model and its contract first, keep
  colour keyed to the unchanged region set, and land the bulk data last against
  contracts that already generalised. The big data commit then stays green
  because nothing about its shape is new, and the geography/region tests never
  move.

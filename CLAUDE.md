# COMP4020 — Assignment 1 prototype

A static, client-side interactive explainer built with HTML/CSS/TypeScript on
Astro, deployed to GitHub Pages. The **deployed URL** is what's marked — live in
Chrome, at **1920×1080** and **390×844**, both in full — and *how the work was
run* is marked alongside it, at nearly half the weight.

## Read AGENTS.md first

`AGENTS.md` is the operating harness: the working loop, the sensors `pnpm check`
runs, what to do when a check goes red, the hard constraints, and the harness
log that grows as the work corrects itself. **Read it before planning or
building.** Operating rules live there and only there, so this file and that one
never drift — this file is the map, `AGENTS.md` is how the work is run.

## Where things live

- `AGENTS.md` — the operating harness (read first)
- `spec/` — invariants plus the week's spec tests; `spec/README.md` explains how
  the checks map to the brief and spec
- `PROCESS.md` — the reading-guide to the process evidence, each moment cited to
  a commit (`pnpm check:evidence` verifies the citations resolve)
- `reflections/assignment-1.md` — the reflection, due at the cutoff; no file, no
  shipped week
- every `.html` / Astro route is a page the build picks up

## Critical reminders (detail is in AGENTS.md)

- **Never commit secrets.** No keys, tokens, or passwords in tracked files; the
  pre-commit hook is the sensor that matters. If one leaks, rotate it.
- **Commit when checks pass; never commit a red state.** The trail is the
  evidence, so grow it in small, honest steps.
- **Verify against the rendered page**, not your mental model of it — use
  `agent-browser` to look at the real output before believing a change worked.
- **No em-dashes, no "--", no AI-isms** in anything shipped or written.
- **No identity files.** No name, student number, or personal profile in this
  repo; the marker already knows whose it is, and it goes public when shipped.

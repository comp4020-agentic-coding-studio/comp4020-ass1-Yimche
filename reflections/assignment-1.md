# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

Realising I had built the wrong thing well, and cutting it. I started by
inverting the obvious order — writing the runway rules as failing tests and
making them pass before drawing a pixel — and that discipline was real: a full
simulation with three views and a five-line ranking function for *who goes next
and why*, each view just a redraw of one tested model. But looking at it beside
the plain diagrammatic explainer I was measuring against, it was heavier than
the brief needed and harder to read. The breakthrough was letting that go:
replacing the simulation with a short scripted choreography, dropping the map
and the manual controls, and rebuilding the page as one immersive scene where
popups do the explaining. The model-first habit carried straight over — the
choreography is again pure data the view only renders — but the lesson that
moved the work forward was that removing working code to answer a critique is
harder, and more valuable, than writing more of it.

## What did this work change about who I want to be as a software developer?

I want to be someone who fixes the process, not just the output. The moment I'm
proudest of wasn't a feature — it was noticing that my own harness rule ("never
commit red") contradicted the evidence the work needed, and resolving it in the
rules rather than quietly working around it. The same instinct made me add an
accessibility check the tool roster was missing instead of promising myself I'd
remember. Directing an agent rewards this: when a correction lives in the harness
or a test, it holds; when it lives in a prompt, it evaporates. I'd rather build
the backpressure than keep re-typing the same note.

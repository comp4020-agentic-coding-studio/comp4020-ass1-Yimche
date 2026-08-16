# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

Deciding that the runway model had to be a pure function before a single pixel
was drawn. I started wanting three views, and the pull was to build the prettiest
one first and bolt logic onto it. The breakthrough was inverting that: write the
sequencing rules as failing tests, make them pass, and only then draw. Once the
model was a tested thing in its own right, the three views stopped being three
features and became three ways of reading the same state. The map and the
inside-ATC screen cost almost nothing because neither needed to touch the logic —
they just render it. The one idea I most wanted to land, *who goes next and why*,
turned out to be a five-line ranking function I could test directly and then let
the ATC view narrate.

## What did this work change about who I want to be as a software developer?

I want to be someone who fixes the process, not just the output. The moment I'm
proudest of wasn't a feature — it was noticing that my own harness rule ("never
commit red") contradicted the evidence the work needed, and resolving it in the
rules rather than quietly working around it. The same instinct made me add an
accessibility check the tool roster was missing instead of promising myself I'd
remember. Directing an agent rewards this: when a correction lives in the harness
or a test, it holds; when it lives in a prompt, it evaporates. I'd rather build
the backpressure than keep re-typing the same note.

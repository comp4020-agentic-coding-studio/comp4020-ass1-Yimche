# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

Realising I had built the wrong thing well, and cutting it.
I first built a complete, sorta working explainer of air-traffic control, but
the issue with it was that it seemed a bit over-complicated for what was being
asked for submission, and I was struggling to get the agent to work to my ideal.

The breakthrough was letting the whole thing go and starting over on a new
direction: "how did we get here?".
A single scrollable axis of civilisations, where the point is to be able to
easily view the coexistence of civilisations across human time.

The second breakthrough was giving up on expecting the agent to understand
spatial geometry and relative positioning.
This especially was an issue with the original deign of the air traffic control,
but also came up in this version where many objects overlapped or didn't make
sense.
Currently some arrows still look weird, but I believe that to be a fault of the
library it used to generate the arrows, as I have seen similar behaviours in
online diagram tools like draw.io.

What moved the work forward both times was subtraction and framing, not more
features: removing a finished prototype, then refusing to add bloat and visual
clutter with more disconnected widgets to force something that worked.

## What did this work change about who I want to be as a software developer?

I want to be someone who fixes the process, not just the output.
What tended to happen during this development is that I would give it an
objective, and then after reviewing the output, I would go in and give it a 
numbered list of steps and actions I wanted the agent to take and fix certain
features / bugs.
I found this to be tedium and wished that I could either directly interject in
the process and correct such errors, however, AI currently still doesn't
understand spacial geometry the way we humans do, and thus doesn't see any wrong
in incorrect arrowheads, as long as the tip is at the goal.

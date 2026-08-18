---
name: Techniques Safari gauge
description: Rendering constraint for the Techniques tab instrument rings on iPhone Safari.
---

The critical background gauge on the Techniques tab should be rendered with explicit SVG circles, arcs, and strokes. CSS `mask-image` combined with conic gradients is not reliable enough for the iPhone path and can make the rings appear unloaded.

**Why:** The mobile preview showed the surrounding glow and particles while masked conic-gradient rings disappeared on the physical iPhone, even though desktop browsers rendered them.

**How to apply:** Keep CSS masks only for optional decoration. Any ring whose absence makes the instrument backdrop look broken must have a visible SVG stroke/path fallback.
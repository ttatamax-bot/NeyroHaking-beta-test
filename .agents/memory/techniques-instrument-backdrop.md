---
name: Techniques instrument backdrop
description: The durable visual rule for the Techniques tab background.
---

The Techniques tab background should read as the same technical instrument panel as the main PotentialScale: dark steel, warm orange/cream accents, thin concentric gauges, segmented arcs, ticks, sparse indicator sparks, and several offset gear-like instrument centers. It must not read as a solar system, orbit map, or neon space scene.

**Why:** The user explicitly rejected orbital rings, flying dark dots, and a single shared center because they visually diverged from the main screen and felt cosmic rather than steampunk/instrumental.

**How to apply:** Reuse the main gauge’s visual language and animation structure for future background changes. Keep the existing technique icon-wells as the only card-like surfaces; do not add decorative technique tiles.

On iOS, keep the atmosphere and ring anchor on their own GPU-composited layer (`translate3d` plus backface hiding) when technique cards use 3D transforms.

**Why:** WebKit can drop masked conic-gradient ring layers during 3D compositing, making the existing background appear to vanish even though its design is still present.

**How to apply:** Preserve the existing ring artwork and stabilize its compositing layer before changing opacity, masks, or adding fallback decoration.
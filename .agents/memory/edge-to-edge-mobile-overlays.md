---
name: Edge-to-edge mobile overlays
description: Mobile overlays and themed screens must cover safe areas and the full viewport.
---

Use `viewport-fit=cover`, full-width app shells, and route-specific chrome visibility for overlays and themed screens. Do not let a centered max-width shell or persistent TopBar define the visible background of an article, technique atmosphere, or cinematic.

**Why:** iOS safe-area space and the old 390px shell exposed the previous app screen above, beside, and around additional screens.

**How to apply:** Keep fixed overlays at `inset: 0` with an opaque background, make full-screen layouts edge-to-edge, hide TopBar/NavBar when the route owns the screen, and verify at both 402px and wider mobile widths.
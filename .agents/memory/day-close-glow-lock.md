---
name: Day-close glow lock
description: Central day-close glow timing around the final potential milestone.
---

The central `close-flash` glow should hold its peak from the 99.5% potential lock through the 100% milestone; it is separate from the segmented scale animation.

**Why:** The visual peak can appear to fade before the displayed 100% if the flash uses a single peak exactly at the completion timestamp.

**How to apply:** When adjusting the day-close cinematic or rolling back an edge-case branch, preserve the 99.5%-to-100% central glow plateau independently of the scale bars.
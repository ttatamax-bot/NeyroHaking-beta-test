---
name: Segmented gauge rendering
description: Reliable rendering pattern for animated segmented SVG progress gauges.
---

For segmented SVG progress gauges, render each segment as one direct path whose stroke color is either active or inactive. Use a dash mask only for the single partially filled segment, and animate opacity or glow rather than revealing every segment with `pathLength` overlays.

**Why:** short elliptical arc paths combined with Framer Motion `pathLength`/`strokeDasharray` overlays rendered as tiny inner marks or appeared incomplete in the preview's first captured frame, even when the intended percentage was correct.

**How to apply:** calculate full active segments plus one fractional segment from the display percentage; keep the first frame visually truthful, then add subtle breathing/pulse motion without hiding the scale.
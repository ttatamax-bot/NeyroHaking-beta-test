---
name: Techniques icon wells
description: Visual rule for the techniques tab icon containers.
---

The techniques tab uses transparent outer cards, but each technique keeps a distinct square icon well with a colored fill, border, and animated icon scaled proportionally inside it.

**Why:** The intended visual reference is a compact filled and outlined square around each icon; removing that square makes the technique grid lose its intended hierarchy.

**How to apply:** When redesigning this tab, remove only the large card background/surface. Do not remove the square icon container or its fill and border.

The walk technique must keep the original Lucide `Footprints` geometry; animate its two existing footprints independently instead of redrawing the glyph.

**Why:** The user specifically rejected custom replacement footprints because they no longer read as real tracks.

**How to apply:** For walk animation changes, preserve the four Lucide path shapes and adjust only timing, opacity, scale, and position.
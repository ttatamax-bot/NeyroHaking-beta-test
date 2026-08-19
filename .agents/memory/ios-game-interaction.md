---
name: iOS game interaction
description: Mobile Safari interaction rules for memory game boards and cells.
---

Interactive memory boards must opt out of text selection, touch callouts, drag behavior, and default tap highlights; otherwise iOS can draw blue selection/focus frames around square cells.

**Why:** Safari interprets long presses on button/grid content as text selection or native focus, which interrupts matrix play.

**How to apply:** Scope `user-select: none`, `-webkit-touch-callout: none`, `touch-action: manipulation`, and custom focus styling to the game board only; keep normal app text selectable.
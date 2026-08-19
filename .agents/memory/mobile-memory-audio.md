---
name: Mobile memory audio
description: Mobile browser constraints for the memory practice Web Audio feedback.
---

Memory practice sounds must unlock `AudioContext` during a real user gesture and resume it after page visibility changes. Creating the context alone is not enough on iOS Safari or Android Chrome.

**Why:** Mobile autoplay policy can leave a context suspended, so sounds scheduled later by the two-second game timer are silently dropped even though desktop playback works.

**How to apply:** Keep the unlock call on the level-start interaction, use a tiny oscillator for the unlock gesture, resume before scheduling tones, and retain `pageshow`/`visibilitychange` recovery.
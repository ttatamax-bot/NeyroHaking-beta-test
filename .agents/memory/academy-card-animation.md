---
name: Academy card animation
description: Cross-device constraints for the Academy article stack entrance and scroll expansion.
---

Keep the article card's perspective, entrance, and scroll transforms under one transform owner. Do not nest a 3D entrance transform inside a separately transformed 3D stack wrapper on older iOS WebKit. Scroll target updates must use a short transition distinct from the staggered entrance transition.

**Why:** Nested 3D layers combined with blur caused iPhone 11 Safari to paint cards at a narrow width and then snap them to the correct size. Reusing the long entrance delay for scroll updates made the stack feel frozen or removed the expansion effect.

**How to apply:** Preserve the visual entrance properties, combine them with the current stack target in one motion layer, and switch to a low-latency transition after mount so `stackProgress` responds continuously while scrolling.

On compact mobile cards, keep the article icon and the access metadata in separate flex columns; never constrain a right-aligned price label to the lock icon's narrow width.

**Why:** The `400 ключей` label is wider than the lock mark and overflowed left into the article icon on iPhone.

**How to apply:** Give the access column a stable minimum width, keep price labels on one line, and give the header an explicit full width with `justify-between`; iOS Safari may not stretch that flex child implicitly inside the transformed card.
---
name: Progress save loop
description: Preventing repeated account-state writes during authenticated progress hydration.
---

The authenticated progress autosave effect must not replace React state when the server response only changes volatile metadata such as `profile.updatedAt`.

**Why:** The server returns a fresh profile object after every successful state save. Treating that object as a state change retriggered the two-second autosave effect indefinitely, making the progress screen appear stuck and flooding `/api/me/state`.

**How to apply:** Compare persisted state values and stable profile fields before calling `setState`; preserve the existing profile object when only timestamps changed.
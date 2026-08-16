---
name: Email-only Clerk workaround
description: Product decision for email-code registration when Replit-managed Clerk still requires a password.
---

The app presents only an app username after email verification. Clerk receives a cryptographically random technical password automatically, while sign-in remains email-code based and the technical password is never shown or requested.

**Why:** Replit-managed Clerk does not expose the password/username requirement policy in the available Auth pane, but the product requirement is no user-facing password.

**How to apply:** Keep the technical credential internal and never derive it from the email or username. Store the chosen username through the app's profile setup, not as a Clerk username unless the managed Clerk setting is later enabled.
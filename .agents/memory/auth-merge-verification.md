---
name: Auth merge verification
description: Durable review rule for authentication changes that can affect guest onboarding.
---

After any Clerk-related merge, recheck both guest entry paths: returning local progress and first completed technique. Authentication work can touch shared app routing and accidentally restore an older redirect implementation.

**Why:** A merged Clerk customization change previously replaced the guest redirect safeguards even though the auth screens themselves still looked correct.

**How to apply:** Before declaring auth work complete, verify the guest redirect logic is still present, run the frontend typecheck/build, restart the web workflow, and inspect both sign-up and sign-in screens.
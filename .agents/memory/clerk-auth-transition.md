---
name: Clerk auth transition race
description: Prevent guest-progress routing from undoing a newly completed email-code sign-in.
---

After `setActive()` completes, Clerk's session state may reach React one render later. A guest-progress redirect that runs during that gap can send the user back to sign-up even though Clerk has already accepted the code and created a session.

**Why:** A real cross-device email-code sign-in generated Clerk's new-device notification but the app navigated back before `isSignedIn` reflected the new session.

**How to apply:** Mark the auth transition before `setActive()`, use a full base-aware navigation after it, and let the global guest redirect wait briefly for `isSignedIn`. Exclude profile setup from guest redirects as well.
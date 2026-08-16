---
name: Clerk sign-up requirements
description: Clerk email-code sign-up behavior when verification succeeds but account creation is not complete.
---

Email verification does not always create the Clerk session immediately. `SignUpResource` can return `missing_requirements`, so the flow must collect and submit the fields listed by Clerk before activating `createdSessionId`.

**Why:** The email code was valid, but the custom flow treated a valid verification with missing required fields as an invalid code and never created the account.

**How to apply:** After `attemptEmailAddressVerification`, handle `missing_requirements` explicitly, submit the required fields with `signUp.update`, then activate the session only after status becomes `complete`.
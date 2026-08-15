---
name: Clerk passwordless flow
description: The installed Clerk React version needs standard client resources for reliable custom passwordless auth.
---

For passwordless web auth, use the standard resources exposed through `useClerk().client.signUp` and `.signIn`, not the signal-based Future resources. Email-code flows use create/prepare/attempt; magic-link flows use `createEmailLinkFlow().startEmailLinkFlow()` and the Clerk instance's `handleEmailLinkVerification()`. Custom sign-up forms must mount Clerk's `#clerk-captcha` placeholder before `signUp.create()`.

**Why:** The Future resource's request can remain pending in the managed development environment, while importing `@clerk/react/legacy` separately can create a mismatched Clerk React context. Without `#clerk-captcha`, Clerk falls back to invisible bot protection and can leave custom signup requests pending. Email delivery on external production domains also requires Clerk/Replit DNS CNAME records.

**How to apply:** Keep password inputs out of the UI, add a finite timeout around Clerk requests, surface returned errors near the auth form, and verify the domain's email CNAME setup when messages are not delivered. Clerk email-template language is controlled by instance customization; client localization alone does not translate system email copy.
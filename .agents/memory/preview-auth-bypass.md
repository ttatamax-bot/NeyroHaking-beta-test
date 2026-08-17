---
name: Preview auth bypass
description: Development preview access rules for testing authenticated techniques.
---

The unauthenticated technique-testing bypass is guarded by `import.meta.env.DEV`, which is true for the Replit Vite preview and false in production builds. The real Clerk redirect, sign-in, and sign-up flow remains active outside preview.

**Why:** Developers need to exercise technique UI and game loops without creating an account, while beta and production must continue enforcing account-backed persistence and server authorization.

**How to apply:** Keep preview-only fake completion and unlocked-memory behavior behind the same dev check; never replace the server-authenticated path or expose the bypass in a production configuration.
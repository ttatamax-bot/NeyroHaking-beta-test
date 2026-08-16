---
name: Vercel Clerk environment
description: External Vercel deployment requirement for the frontend Clerk key.
---

The Vercel project must define `VITE_CLERK_PUBLISHABLE_KEY` for the environment being deployed. When it is missing, the host-based key helper can build a domain-derived placeholder instead of a real Clerk key, leaving `isLoaded` false while the custom auth screen remains visible.

**Why:** The published Vercel bundle showed the current auth code but Clerk never became ready; inspecting the compiled bundle showed the env value was absent.

**How to apply:** Check the deployed bundle or page behavior when auth is stuck. Add the public `pk_...` key to Vercel Production (and Preview if needed), never the secret key, then redeploy without the old build cache.
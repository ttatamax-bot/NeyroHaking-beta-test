---
name: Vercel frozen lockfile
description: Keep workspace lockfile synchronized when reverting package manifests before Vercel deploys.
---

Vercel installs this workspace with `pnpm install --frozen-lockfile`, so a rollback that changes a workspace package manifest must carry the matching lockfile change in the same deployment sequence.

**Why:** A code-correct rollback can still fail before build when the lockfile retains a removed workspace dependency.

**How to apply:** Run a lockfile-only workspace install after manifest changes, validate typechecks/builds, and publish the manifest plus lockfile together.
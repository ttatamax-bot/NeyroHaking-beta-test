---
name: Beta Vercel source sync
description: Prevent partial GitHub tree updates from producing Vercel builds that differ from the local workspace.
---

When a GitHub-backed Vercel project is updated through Git tree/blob APIs, update from the current full remote tree and verify it against the local tracked source list before deployment. A locally successful build does not prove that the remote beta branch contains every imported source file.

**Why:** Incremental tree updates can preserve an older branch snapshot while adding only the files named in the latest change. Vercel then fails on imports that exist locally but were never uploaded.

**How to apply:** For beta fixes, compare local tracked `api/**` and frontend `src/**` paths with the remote recursive tree, add all missing files in one commit, then trigger or verify a deployment from that commit and check the stable alias. If the GitHub webhook does not create a build, trigger the linked Vercel project with the same GitHub repo ID, `main` ref, and commit SHA.
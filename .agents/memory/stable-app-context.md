---
name: Stable app context
description: React context identity must survive store-module hot reloads in the development preview.
---

Keep the shared app context in a small stable module rather than creating it inside the large state/store module.

**Why:** HMR can refresh the Provider and leave consumers holding the previous context identity, producing `useAppStore must be used within AppProvider` even though the JSX tree is correctly nested.

**How to apply:** When changing the store implementation, preserve the context module boundary; validate with a full workflow restart and a fresh browser console.
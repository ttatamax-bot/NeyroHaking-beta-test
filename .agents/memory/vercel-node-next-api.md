---
name: Vercel API NodeNext compatibility
description: API typechecking on Vercel may use NodeNext even when local workspace checks use bundler resolution.
---

The API package must remain valid under strict NodeNext TypeScript checking: internal relative imports use emitted `.js` specifiers, CommonJS middleware packages may need named imports or explicit interop settings, generated workspace exports may be invisible to Vercel, workspace libraries can resolve duplicate Drizzle type instances, and the function compiler may need small structural adapters around Express and proxy middleware runtime boundaries.

**Why:** Vercel reported Node16/NodeNext import, Express/Pino, proxy middleware, generated export, and duplicate-Drizzle typing errors even though the local workspace typecheck used package-specific resolution and passed; each deployment exposed the next incompatible declaration.

**How to apply:** When changing the API entrypoint or server imports, run the API package typecheck with its NodeNext configuration in addition to the normal workspace checks; keep database query helpers on one Drizzle boundary, avoid direct `Express`/`Application` annotations on the exported runtime app, and avoid depending on fragile generated package re-exports at the Vercel function boundary.
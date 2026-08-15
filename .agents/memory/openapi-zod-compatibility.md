---
name: OpenAPI Zod compatibility
description: Compatibility constraint between Orval-generated schemas and the workspace
---

The current Orval generator emits Zod 4 APIs such as `z.int()` and `z.url()`. Keep the shared Zod catalog on Zod 4 and run API codegen after OpenAPI changes; do not hand-edit generated files to target Zod 3.

**Why:** With Zod 3, generated code compiles incorrectly after regeneration and the API client/types drift from the source contract.

**How to apply:** Treat a Zod catalog downgrade as a coordinated generator/configuration change, not as a routine dependency edit.
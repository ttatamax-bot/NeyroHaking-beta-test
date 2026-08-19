---
name: Vercel preview schema builds
description: Why Vercel preview builds must not run database schema bootstrap when DATABASE_URL is production-only.
---

Vercel preview deployments can omit environment variables that are configured only for the production target. A build command that runs schema bootstrap before compiling the frontend will therefore fail before the app is built, even when the production deployment is healthy.

**Why:** The beta preview deployment had `DATABASE_URL` configured only for production, while its build command invoked `ensure-schema`; Vercel failed with `DATABASE_URL is required to initialize the database schema`.

**How to apply:** Keep schema provisioning as an explicit environment/migration step, not part of the Vercel frontend build command. Preview builds should only install dependencies and compile the app; runtime API access still needs its own preview environment configuration if beta testing exercises authenticated database flows. For the beta-test Vercel project, `main` is the established beta branch and the stable project domain is the correct test URL; do not create a temporary branch unless requested.
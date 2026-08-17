---
name: Preview static assets
description: Root-relative Vite source imports can become broken images behind the artifact preview proxy.
---

For assets shown in the web artifact preview, prefer files in `public` addressed with `import.meta.env.BASE_URL` over root-relative `/src/assets/...` URLs.

**Why:** The preview proxy can serve the SPA HTML for a Vite source-asset URL even though the production bundle resolves the same import correctly, producing a browser broken-image icon only in preview.

**How to apply:** Verify the asset URL with a real `Content-Type: image/*` request after restarting the web workflow, and keep an explicit fallback for important loading visuals.
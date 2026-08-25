import path from 'path';
import { promises as fs } from 'fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';
const devDraftPath = path.resolve(import.meta.dirname, '..', '..', '.local', 'text-drafts.json');

function devTextDraftPlugin() {
  return {
    name: 'dev-text-drafts',
    configureServer(server: { middlewares: { use: (route: string, handler: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/__dev-text-drafts', async (req: any, res: any) => {
        res.setHeader('content-type', 'application/json; charset=utf-8');
        if (req.method === 'GET') {
          try {
            res.end(await fs.readFile(devDraftPath, 'utf8'));
          } catch {
            res.end(JSON.stringify({ fields: [] }));
          }
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!payload || !Array.isArray(payload.fields)) throw new Error('Invalid draft');
            await fs.mkdir(path.dirname(devDraftPath), { recursive: true });
            await fs.writeFile(devDraftPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
            res.end(JSON.stringify({ ok: true, count: payload.fields.length }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid draft' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' ? [devTextDraftPlugin()] : []),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      // Keep Preview same-origin for Clerk cookies and API requests while
      // the frontend and Express service run on separate local workflows.
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: false,
        secure: false,
      },
    },
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

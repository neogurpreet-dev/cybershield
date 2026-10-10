/**
 * Local development server. In production, Vercel serves /api/* from the
 * files in ./api and the built site from ./dist; this mirrors that locally.
 */
import http from 'node:http';
import express from 'express';
import dotenv from 'dotenv';
import siteCheck from './api/site-check.ts';
import urlCheck from './api/url-check.ts';
import assistant from './api/assistant.ts';
import status from './api/status.ts';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100kb' }));

const wrap = (handler: (req: any, res: any) => unknown) => (req: any, res: any) => {
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
  });
};

app.all('/api/site-check', wrap(siteCheck));
app.all('/api/url-check', wrap(urlCheck));
app.all('/api/assistant', wrap(assistant));
app.all('/api/status', wrap(status));

async function start() {
  const { createServer } = await import('vite');
  const httpServer = http.createServer(app);
  // Hot reload shares the same port as the app, so several copies can run side by side.
  const vite = await createServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
  app.use(vite.middlewares);
  httpServer.listen(port, () => console.log(`CyberShield dev server on http://localhost:${port}`));
}

start();

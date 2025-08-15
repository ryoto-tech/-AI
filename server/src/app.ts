import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import path from 'node:path';
import { router as apiRouter } from './routes/api';
import { authMiddleware } from './middleware/auth';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(json({ limit: '10mb' }));
  // serve storage for mock TTS files
  app.use('/storage', express.static(path.resolve(process.cwd(), 'storage')));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  // protect API with auth when enabled
  app.use('/v1', authMiddleware, apiRouter);
  return app;
}

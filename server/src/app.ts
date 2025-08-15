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
  // simple landing page for root access
  app.get('/', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>なぜなぜAI API</title>
    <style> body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif; padding:20px; line-height:1.6;} code{background:#f4f4f4; padding:2px 4px; border-radius:4px;} a{color:#0070f3; text-decoration:none;} a:hover{text-decoration:underline;} </style>
  </head>
  <body>
    <h1>なぜなぜAI API</h1>
    <p>このサーバーはモバイルクライアント向け API を提供しています。</p>
    <ul>
      <li>ヘルスチェック: <a href="/health">/health</a></li>
      <li>子ども作成: <code>POST /v1/children</code></li>
      <li>今日の使用回数: <code>GET /v1/usage/today?child_id=...</code></li>
      <li>質問する: <code>POST /v1/conversations/ask</code></li>
      <li>履歴: <code>GET /v1/history?child_id=...&limit=20</code></li>
    </ul>
    <p>注: 本番では認証が有効化されます（MVP では dev-token）。</p>
  </body>
</html>`);
  });
  // protect API with auth when enabled
  app.use('/v1', authMiddleware, apiRouter);
  return app;
}

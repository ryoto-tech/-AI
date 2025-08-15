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
    <p>このサーバーはモバイルクライアント向け API を提供しています。すぐ試せる <a href="/demo">デモページ</a> もあります。</p>
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

  // very simple web demo page using dev-token
  app.get('/demo', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>デモ | なぜなぜAI</title>
    <style>
      body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif; padding:16px}
      input,button{font-size:16px; padding:8px;}
      .muted{color:#666}
      .box{border:1px solid #ddd; border-radius:8px; padding:12px; margin:12px 0}
      code{background:#f5f5f5; padding:2px 4px; border-radius:4px}
    </style>
  </head>
  <body>
    <h1>デモ</h1>
    <p class="muted">このページは簡易デモです。サーバーが <code>AUTH_ENABLED=true</code> の場合は dev-token を使用します。</p>
    <div class="box">
      <div>child_id: <code id="child">(未取得)</code></div>
      <div>きょう きける かず: <span id="quota">-</span></div>
      <button id="init">子どもを作成/取得</button>
    </div>
    <div class="box">
      <input id="q" placeholder="なぜ空は青いの？" size="30" />
      <button id="ask">質問する</button>
      <div id="ans" style="margin-top:8px"></div>
      <div id="tts" class="muted" style="margin-top:4px"></div>
    </div>
    <script>
      const BASE = location.origin;
      const TOKEN = 'dev-token';
      async function api(path, opts={}){
        const headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
        headers['Authorization'] = 'Bearer ' + TOKEN;
        const res = await fetch(path, Object.assign({}, opts, { headers }));
        if(!res.ok){ throw new Error('HTTP '+res.status+': '+await res.text().catch(()=>'')); }
        return res.json();
      }
      async function ensureChild(){
        let id = localStorage.getItem('child_id');
        if(id) return id;
        const r = await api('/v1/children', { method:'POST', body: JSON.stringify({ name:'デモ', age:5 }) });
        id = r.child_id; localStorage.setItem('child_id', id); return id;
      }
      async function refreshQuota(child){
        const r = await fetch('/v1/usage/today?child_id='+encodeURIComponent(child));
        const j = await r.json();
        document.getElementById('quota').textContent = (j.limit - j.question_count);
      }
      async function init(){
        try{
          const child = await ensureChild();
          document.getElementById('child').textContent = child;
          await refreshQuota(child);
        }catch(e){ alert('初期化エラー: '+e.message); }
      }
      document.getElementById('init').addEventListener('click', init);
      document.getElementById('ask').addEventListener('click', async ()=>{
        const child = localStorage.getItem('child_id');
        if(!child){ alert('先に子どもを作成してください'); return; }
        const text = (document.getElementById('q').value||'').trim() || 'なぜ空は青いの？';
        try{
          const r = await api('/v1/conversations/ask', { method:'POST', body: JSON.stringify({ child_id: child, text, tts:{ volume: 1.0, rate: 1.0 } }) });
          document.getElementById('ans').textContent = r.answer_text;
          document.getElementById('tts').innerHTML = r.tts_audio_url ? ('TTS: <a href="'+r.tts_audio_url+'" target="_blank">'+r.tts_audio_url+'</a>') : '';
          await refreshQuota(child);
        }catch(e){ alert('送信エラー: '+e.message); }
      });
      // auto init
      init();
    </script>
  </body>
</html>`);
  });
  // protect API with auth when enabled
  app.use('/v1', authMiddleware, apiRouter);
  return app;
}

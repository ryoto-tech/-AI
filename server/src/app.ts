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

  // friendlier web demo page (no raw IDs, simple buttons, small history)
  app.get('/demo', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>なぜなぜAI デモ</title>
    <style>
      :root{ --accent:#ff8c00; --bg:#ffffff; --fg:#000000; --muted:#666; --card:#ffffff; --border:#eee }
      [data-theme="dark"]{ --bg:#0f1115; --fg:#eaeaea; --muted:#99a0aa; --card:#151923; --border:#232a36 }
      @media (prefers-color-scheme: dark){ :root{ --bg:#0f1115; --fg:#eaeaea; --muted:#99a0aa; --card:#151923; --border:#232a36 } }
      body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif; padding:16px; background:var(--bg); color:var(--fg)}
      h1{margin:0 0 8px 0}
      .muted{color:var(--muted); font-size:14px}
      .card{border:1px solid var(--border); background:var(--card); border-radius:12px; padding:16px; margin:12px 0}
      .row{display:flex; gap:8px; align-items:center}
      .btn{background:var(--accent); color:#fff; border:none; border-radius:999px; padding:12px 18px; font-size:18px; cursor:pointer}
      .btn:disabled{opacity:.5; cursor:not-allowed}
      .text{flex:1; padding:12px 14px; font-size:18px; border:1px solid var(--border); border-radius:12px; background:transparent; color:var(--fg)}
      .chip{border:1px solid var(--border); border-radius:16px; padding:8px 12px; cursor:pointer; background:transparent; color:var(--fg)}
      .chip:hover{background:rgba(0,0,0,.03)}
      [data-theme="dark"] .chip:hover{ background:rgba(255,255,255,.06) }
      .bubbles{display:flex; flex-direction:column; gap:8px; margin-top:8px}
      .me,.ai{max-width:90%; padding:10px 12px; border-radius:12px}
      .me{align-self:flex-end; background:rgba(0,122,255,.12)}
      .ai{align-self:flex-start; background:rgba(255,255,255,.06)}
      .row-center{display:flex; align-items:center; gap:8px}
      .muted-small{font-size:12px; color:var(--muted)}
      .mascot{font-size:72px; text-align:center; filter: drop-shadow(0 2px 2px rgba(0,0,0,.1)); transition: transform .2s ease}
      a{color:#4ea3ff; text-decoration:none}
      a:hover{text-decoration:underline}
    </style>
  </head>
  <body>
    <div class="row" style="justify-content:space-between; align-items:center">
      <h1 style="margin:0">なぜなぜAI デモ</h1>
      <button id="theme" class="chip" title="テーマ切り替え">🌓 テーマ</button>
    </div>
    <p class="muted">これはプロトタイプのデモです。個人情報は入力しないでください。1日に質問できる回数は3回までです。</p>

    <div class="card">
      <div class="mascot" id="bear">🐻</div>
      <div class="row" style="justify-content:space-between">
        <div class="muted">きょう きける かず: <span id="quota">-</span>／リセット時刻: <span id="resetAt">-</span></div>
        <button id="reset" class="chip" title="デモをリセット">リセット</button>
      </div>
      <div style="margin-top:8px" class="row">
        <input id="q" class="text" placeholder="なぜ空は青いの？" aria-label="しつもん" />
        <button id="ask" class="btn">質問する</button>
      </div>
      <div class="row-center muted-small" style="margin-top:6px">
        <button id="rec" class="chip" title="録音">🎤 録音</button>
        <span id="recStat">（テキストでもOK）</span>
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap">
        <span class="chip" data-q="なぜ空は青いの？">なぜ空は青いの？</span>
        <span class="chip" data-q="どうして夜は暗いの？">どうして夜は暗いの？</span>
        <span class="chip" data-q="雨はどうして降るの？">雨はどうして降るの？</span>
      </div>
      <div id="msg" class="muted" style="margin-top:6px"></div>
      <div id="bubbles" class="bubbles"></div>
    </div>

    <div class="card">
      <div class="muted">最新のやりとり</div>
      <ul id="hist" class="muted" style="padding-left:20px; margin:8px 0"></ul>
    </div>

    <script>
      const TOKEN = 'dev-token';
      const $ = (s)=>document.querySelector(s);
      const $$ = (s)=>Array.from(document.querySelectorAll(s));
      const msg = (t)=>{ const el=$('#msg'); el.textContent=t||''; };

      async function api(path, opts={}){
        const headers = Object.assign({'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, opts.headers||{});
        const res = await fetch(path, Object.assign({}, opts, { headers }));
        if(!res.ok){ throw new Error('HTTP '+res.status+': '+await res.text().catch(()=>'')); }
        return res.json();
      }
      function setBusy(b){ const ask=$('#ask'), rec=$('#rec'), bear=$('#bear'); ask.disabled=b; rec.disabled=b; bear.style.transform = b? 'scale(1.07)':'scale(1)'; }
      async function ensureChild(){
        let id = localStorage.getItem('child_id');
        if(id) return id;
        const r = await api('/v1/children', { method:'POST', body: JSON.stringify({ name:'デモ', age:5 }) });
        id = r.child_id; localStorage.setItem('child_id', id); return id;
      }
      async function refreshQuota(child){
        const r = await api('/v1/usage/today?child_id='+encodeURIComponent(child));
        const remain = Math.max(0, (r.limit||3)-(r.question_count||0));
        $('#quota').textContent = remain;
        try{ const d = new Date(r.resets_at); $('#resetAt').textContent = d.toLocaleString(); }catch{ $('#resetAt').textContent = '-'; }
        const ask=$('#ask'), rec=$('#rec');
        if(remain<=0){ ask.disabled = true; rec.disabled = true; msg('今日はここまでです。あした またためしてみてね。'); }
        else { ask.disabled = false; rec.disabled = false; if($('#msg').textContent.includes('ここまで')) msg(''); }
      }
      async function refreshHistory(child){
        const r = await api('/v1/history?child_id='+encodeURIComponent(child)+'&limit=3&offset=0');
        const ul = $('#hist'); ul.innerHTML='';
        (r.items||[]).forEach(it=>{ const li=document.createElement('li'); li.textContent=it.question_text+' → '+it.answer_text; ul.appendChild(li); });
      }
      function addBubble(role, text){
        const div=document.createElement('div'); div.className=role==='me'?'me':'ai'; div.textContent=text; $('#bubbles').appendChild(div);
      }
      async function init(){
        try{
          const child = await ensureChild();
          await refreshQuota(child);
          await refreshHistory(child);
        }catch(e){
          alert('初期化エラー: '+e.message);
        }
      }

      // simple WebAudio recorder (base64 wav) for demo
      let mediaStream, mediaRecorder, chunks=[];
      async function startRec(){
        if(!navigator.mediaDevices){ alert('録音に対応していないブラウザです'); return; }
        try{
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          chunks = [];
          mediaRecorder = new MediaRecorder(mediaStream);
          mediaRecorder.ondataavailable = (e)=>{ if(e.data.size>0) chunks.push(e.data); };
          mediaRecorder.onstop = async ()=>{
            try{
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const buf = await blob.arrayBuffer();
              const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
              // send audio to API
              const child = localStorage.getItem('child_id'); if(!child){ return alert('先にリセットして作成してください'); }
              msg(''); addBubble('me', '🎤（おと）');
              const r = await api('/v1/conversations/ask', { method:'POST', body: JSON.stringify({ child_id: child, audio_base64: b64, tts:{ volume: 1.0, rate: 1.0 } }) });
              addBubble('ai', r.answer_text);
              await refreshQuota(child); await refreshHistory(child);
            }catch(e){
              if((e.message||'').includes('429')){ msg('今日はここまでです。あした またためしてみてね。'); }
              else { msg('録音エラー: '+e.message); }
            }
          };
          mediaRecorder.start();
          $('#rec').textContent = '■ とめる';
          $('#recStat').textContent = '録音中…'; setBusy(true);
        }catch(err){ alert('マイクの許可が必要です'); }
      }
      function stopRec(){ if(mediaRecorder && mediaRecorder.state!=='inactive'){ mediaRecorder.stop(); } if(mediaStream){ mediaStream.getTracks().forEach(t=>t.stop()); } $('#rec').textContent='🎤 録音'; $('#recStat').textContent='（テキストでもOK）'; setBusy(false); }


      $('#ask').addEventListener('click', async ()=>{
        const child = localStorage.getItem('child_id'); if(!child){ return alert('先にリセットして作成してください'); }
        const text = ($('#q').value||'').trim() || 'なぜ空は青いの？';
        msg(''); addBubble('me', text); $('#q').value=''; setBusy(true);
        try{
          const r = await api('/v1/conversations/ask', { method:'POST', body: JSON.stringify({ child_id: child, text, tts:{ volume: 1.0, rate: 1.0 } }) });
          addBubble('ai', r.answer_text);
          await refreshQuota(child); await refreshHistory(child);
        }catch(e){
          if((e.message||'').includes('429')){ msg('今日はここまでです。あした またためしてみてね。'); $('#ask').disabled=true; $('#rec').disabled=true; }
          else { msg('送信エラー: '+e.message); }
        } finally { setBusy(false); }
      });

      $$('.chip').forEach(el=> el.addEventListener('click', ()=>{ $('#q').value = el.getAttribute('data-q') || ''; }));
      $('#reset').addEventListener('click', ()=>{ localStorage.removeItem('child_id'); location.reload(); });
      $('#rec').addEventListener('click', ()=>{ if($('#rec').textContent.includes('録音')) startRec(); else stopRec(); });
      // theme toggle
      (function(){
        const pref = localStorage.getItem('theme');
        if(pref){ document.documentElement.setAttribute('data-theme', pref); }
        $('#theme').addEventListener('click', ()=>{
          const cur = document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', cur);
          localStorage.setItem('theme', cur);
        });
      })();

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

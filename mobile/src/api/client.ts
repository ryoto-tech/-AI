import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = (Constants.expoConfig?.extra?.API_BASE_URL || Constants.manifest?.extra?.API_BASE_URL) as string;
const AUTH_TOKEN = (Constants.expoConfig?.extra?.AUTH_TOKEN || Constants.manifest?.extra?.AUTH_TOKEN) as string;

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function request(path: string, options: RequestInit = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  // 簡易指数バックオフ: 3 回まで
  let lastErr: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json();
    } catch (e) {
      lastErr = e;
      // 429/503 等は少し待って再試行
      await sleep(300 * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

export async function ensureChild(): Promise<string> {
  // 端末に child_id を保存して再利用（初回のみサーバーで作成）
  const KEY = 'child_id';
  try {
    const cached = await AsyncStorage.getItem(KEY);
    if (cached) return cached;
  } catch {}
  const r = await request('/v1/children', { method: 'POST', body: JSON.stringify({ name: 'こども', age: 5, settings: await (async()=>{ try { const raw = await AsyncStorage.getItem('tts_settings'); return raw? JSON.parse(raw): {}; } catch { return {}; } })() }) });
  const id = r.child_id as string;
  try { await AsyncStorage.setItem(KEY, id); } catch {}
  return id;
}

export async function getUsageToday(child_id: string) {
  return request(`/v1/usage/today?child_id=${encodeURIComponent(child_id)}`, { method: 'GET' });
}

export async function askConversation(body: { child_id: string; text?: string; audio_base64?: string; tts?: { volume?: number; rate?: number } }) {
  return request('/v1/conversations/ask', { method: 'POST', body: JSON.stringify(body) });
}

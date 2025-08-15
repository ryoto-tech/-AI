import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = (Constants.expoConfig?.extra?.API_BASE_URL || Constants.manifest?.extra?.API_BASE_URL) as string;
const AUTH_TOKEN = (Constants.expoConfig?.extra?.AUTH_TOKEN || Constants.manifest?.extra?.AUTH_TOKEN) as string;

async function request(path: string, options: RequestInit = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
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

export async function askConversation(body: { child_id: string; text?: string; audio_base64?: string }) {
  return request('/v1/conversations/ask', { method: 'POST', body: JSON.stringify(body) });
}

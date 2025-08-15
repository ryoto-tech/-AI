import Constants from 'expo-constants';

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
  // In a real app we use AsyncStorage; to keep core simple, ask server to create once per launch
  const r = await request('/v1/children', { method: 'POST', body: JSON.stringify({ name: 'こども', age: 5 }) });
  return r.child_id as string;
}

export async function getUsageToday(child_id: string) {
  return request(`/v1/usage/today?child_id=${encodeURIComponent(child_id)}`, { method: 'GET' });
}

export async function askConversation(body: { child_id: string; text?: string; audio_base64?: string }) {
  return request('/v1/conversations/ask', { method: 'POST', body: JSON.stringify(body) });
}

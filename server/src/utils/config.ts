export type Provider = 'mock' | 'openai' | 'gcp';

export const config = {
  authEnabled: () => String(process.env.AUTH_ENABLED || '').toLowerCase() === 'true',
  sttProvider: () => (process.env.STT_PROVIDER as Provider) || 'mock',
  aiProvider: () => (process.env.AI_PROVIDER as Provider) || 'mock',
  ttsProvider: () => (process.env.TTS_PROVIDER as Provider) || 'mock',
  openaiKey: () => process.env.OPENAI_API_KEY || '',
  openaiModel: () => process.env.OPENAI_MODEL || 'gpt-4o-mini',
  dailyLimit: () => 3,
};

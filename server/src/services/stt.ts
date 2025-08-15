export type STTProvider = 'mock' | 'gcp';

import { config } from '../utils/config';

export async function transcribeAudioBase64(audio_base64: string, provider: STTProvider = config.sttProvider() as STTProvider): Promise<string> {
  if (!audio_base64) throw new Error('audio_base64 required');
  switch (provider) {
    case 'mock':
      // Return a fixed simple text for MVP tests
      return 'なぜ空は青いの？';
    case 'gcp':
      // TODO: Implement GCP Speech-to-Text
      // Placeholder to avoid bundling heavy SDK in MVP
      throw new Error('GCP STT not implemented in MVP');
    default:
      throw new Error(`Unknown STT provider: ${provider}`);
  }
}

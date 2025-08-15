export type TTSProvider = 'mock' | 'gcp';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

export async function synthesizeToUrl(text: string, provider: TTSProvider = (process.env.TTS_PROVIDER as TTSProvider) || 'mock'): Promise<string> {
  switch (provider) {
    case 'mock':
      // Write a tiny placeholder file so the URL exists
      const id = randomUUID();
      const dir = path.resolve(process.cwd(), 'storage', 'audio');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${id}.txt`);
      fs.writeFileSync(file, `TTS_PLACEHOLDER: ${text}`);
      return `/storage/audio/${id}.txt`;
    case 'gcp':
      // TODO: Implement Google Cloud TTS
      throw new Error('GCP TTS not implemented in MVP');
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

export type TTSProvider = 'mock' | 'gcp';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

import { config } from '../utils/config';

export type TTSOptions = { volume?: number; rate?: number };

// 互換性のために第2引数はオプション、第3引数で provider を指定可能
export async function synthesizeToUrl(text: string, opts?: TTSOptions, provider?: TTSProvider): Promise<string> {
  const resolvedProvider = provider || (config.ttsProvider() as TTSProvider);
  switch (resolvedProvider) {
    case 'mock':
      // モック: パラメータをメタとしてテキストに書き込む
      const id = randomUUID();
      const dir = path.resolve(process.cwd(), 'storage', 'audio');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${id}.txt`);
      const meta = opts ? ` volume=${opts.volume ?? ''} rate=${opts.rate ?? ''}` : '';
      fs.writeFileSync(file, `TTS_PLACEHOLDER${meta}: ${text}`);
      return `/storage/audio/${id}.txt`;
    case 'gcp':
      // TODO: Implement Google Cloud TTS. volume/rate を API に反映
      throw new Error('GCP TTS not implemented in MVP');
    default:
      throw new Error(`Unknown TTS provider: ${resolvedProvider}`);
  }
}

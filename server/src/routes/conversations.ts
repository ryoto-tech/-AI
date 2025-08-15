import { Router } from 'express';
import { z } from 'zod';
import { checkAndInc } from './usage';

export const router = Router();

const AskSchema = z.object({
  child_id: z.string().uuid(),
  // For MVP: either text or base64 audio. We'll accept text to keep it simple first.
  text: z.string().min(1).max(200).optional(),
  audio_base64: z.string().optional()
}).refine((v) => v.text || v.audio_base64, { message: 'text or audio required' });

// naive category classifier
function classify(text: string): '動物'|'自然'|'科学'|'日常'|'その他' {
  const t = text;
  if (/(いぬ|ねこ|くま|どうぶつ|動物)/i.test(t)) return '動物';
  if (/(そら|やま|はな|自然|天気|空|山|海)/i.test(t)) return '自然';
  if (/(なぜ|どうして|ひかり|でんき|科学|星|宇宙)/i.test(t)) return '科学';
  if (/(ごはん|おふろ|あそぶ|日常|ようちえん)/i.test(t)) return '日常';
  return 'その他';
}

router.post('/ask', async (req, res) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { child_id, text } = parsed.data;

  // quota check
  const quota = checkAndInc(child_id);
  if (!quota.allowed) return res.status(429).json({ error: 'daily limit reached', quota: { used: quota.used, limit: 3 } });

  // STT placeholder: if audio provided, pretend it's "なぜ空は青いの？"
  const userText = text || 'なぜ空は青いの？';

  // AI generation placeholder per spec
  const answer_text = '空には光があたって、青い色がいちばん見えやすいからだよ。';
  const category = classify(userText);
  const related_question = 'ほかの色はどう見えるのかも知りたい？';

  // TTS placeholder: return a dummy URL
  const tts_audio_url = `https://example.com/audio/${encodeURIComponent(answer_text)}.mp3`;

  // In MVP skeleton, we just echo and do not persist.
  res.json({ answer_text, category, related_question, tts_audio_url, quota: { used: quota.used, limit: 3 } });
});

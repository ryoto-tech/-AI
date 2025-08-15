// TODO(MVP->Phase2): Wire real STT(OpenAI Whisper or GCP), OpenAI chat, and TTS(GCP TTS).
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

import { transcribeAudioBase64 } from '../services/stt';
import { generateAnswerForChild } from '../services/ai';
import { synthesizeToUrl } from '../services/tts';
import { addConversation } from '../store/conversations';
import { classify } from '../utils/classifier';

router.post('/ask', async (req, res) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { child_id, text, audio_base64 } = parsed.data as any;

  // quota check
  const quota = checkAndInc(child_id);
  if (!quota.allowed) return res.status(429).json({ error: 'daily limit reached', quota: { used: quota.used, limit: 3 } });

  // STT (mock or GCP in future)
  const userText = text || await transcribeAudioBase64(audio_base64!);

  // AI generation
  const ai = await generateAnswerForChild(userText);
  const category = ai.category || classify(userText);

  // TTS synth
  const tts_audio_url = await synthesizeToUrl(ai.answer_text);

  // persist in-memory
  addConversation({
    conversation_id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    child_id,
    question_text: userText,
    answer_text: ai.answer_text,
    audio_file_urls: { output: tts_audio_url },
    category,
    timestamp: new Date().toISOString(),
  });

  res.json({ answer_text: ai.answer_text, category, related_question: ai.related_question, tts_audio_url, quota: { used: quota.used, limit: 3 } });
});

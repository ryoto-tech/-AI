// TODO(MVP->Phase2): Wire real STT(OpenAI Whisper or GCP), OpenAI chat, and TTS(GCP TTS).
import { Router } from 'express';
import { z } from 'zod';
import { checkAndInc } from './usage';

export const router = Router();

const AskSchema = z.object({
  child_id: z.string().uuid(),
  // For MVP: either text or base64 audio. We'll accept text to keep it simple first.
  text: z.string().min(1).max(200).optional(),
  audio_base64: z.string().optional(),
  // 将来の TTS パラメータ（現状は無視）
  tts: z.object({ volume: z.number().min(0).max(1).optional(), rate: z.number().min(0.5).max(1.5).optional() }).optional().nullable()
}).refine((v) => v.text || v.audio_base64, { message: 'text or audio required' });

import { transcribeAudioBase64 } from '../services/stt';
import { generateAnswerForChild } from '../services/ai';
import { synthesizeToUrl } from '../services/tts';
import { prisma } from '../store/db';
import { classify } from '../utils/classifier';

router.post('/ask', async (req, res) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { child_id, text, audio_base64, tts } = parsed.data as any;

  // quota check
  const quota = await checkAndInc(child_id);
  if (!quota.allowed) return res.status(429).json({ error: 'daily limit reached', quota: { used: quota.used, limit: 3 } });

  // STT (mock or GCP in future)
  const userText = text || await transcribeAudioBase64(audio_base64!);

  // AI generation
  const ai = await generateAnswerForChild(userText);
  const category = ai.category || classify(userText);

  // TTS synth
  const tts_audio_url = await synthesizeToUrl(ai.answer_text); // TODO: rate/volume を将来反映

  // persist DB
  await prisma.conversation.create({ data: {
    child_id,
    question_text: userText,
    answer_text: ai.answer_text,
    audio_output_url: tts_audio_url,
    category,
  }});

  res.json({ answer_text: ai.answer_text, category, related_question: ai.related_question, tts_audio_url, quota: { used: quota.used, limit: 3 } });
});

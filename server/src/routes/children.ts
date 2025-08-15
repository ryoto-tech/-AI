import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../store/db';

export const router = Router();

const CreateChildSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(3).max(6),
  user_id: z.string().uuid().optional().nullable(),
  // 将来のための簡易設定（モバイル側はローカル適用だが保存先を用意）
  settings: z.object({ ttsVolume: z.number().min(0).max(1).optional(), ttsRate: z.number().min(0.5).max(1.5).optional() }).optional().nullable(),
});

router.post('/', async (req, res) => {
  try {
    const parsed = CreateChildSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { name, age, user_id, settings } = parsed.data as any;
    const child = await prisma.child.create({ data: { name, age, user_id: user_id ?? undefined, settings: settings || {} } });
    res.json(child);
  } catch (e: any) {
    res.status(500).json({ error: 'create_failed', detail: String(e?.message || e) });
  }
});

router.get('/me', async (_req, res) => {
  const children = await prisma.child.findMany({ orderBy: { created_at: 'desc' } });
  res.json({ children });
});

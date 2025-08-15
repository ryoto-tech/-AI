import { Router } from 'express';
import { z } from 'zod';

export const router = Router();

const CreateChildSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(3).max(6)
});

// In-memory store for MVP
const children: any[] = [];

router.post('/', (req, res) => {
  const parsed = CreateChildSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const child = { child_id: crypto.randomUUID(), created_at: new Date().toISOString(), settings: {}, ...parsed.data };
  children.push(child);
  res.json(child);
});

router.get('/me', (_req, res) => {
  res.json({ children });
});

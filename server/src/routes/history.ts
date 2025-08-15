import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../store/db';

export const router = Router();

const ListSchema = z.object({ child_id: z.string().uuid(), limit: z.coerce.number().min(1).max(50).default(20), offset: z.coerce.number().min(0).max(500).default(0) });

router.get('/', async (req, res) => {
  const parsed = ListSchema.safeParse({ child_id: req.query.child_id, limit: req.query.limit, offset: req.query.offset });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { child_id, limit, offset } = parsed.data;
  const items = await prisma.conversation.findMany({ where: { child_id }, orderBy: { timestamp: 'desc' }, skip: offset, take: limit });
  res.json({ items });
});

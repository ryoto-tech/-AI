import { Router } from 'express';
import { DAILY_LIMIT, getTodayUsage, incTodayUsage, resetTimeISO } from '../store/usageDb';

export const router = Router();

router.get('/today', async (req, res) => {
  const child_id = (req.query.child_id as string) || '';
  if (!child_id) return res.status(400).json({ error: 'child_id required' });
  const used = await getTodayUsage(child_id);
  res.json({ question_count: used, limit: DAILY_LIMIT, resets_at: resetTimeISO() });
});

export async function checkAndInc(child_id: string) {
  const used = await getTodayUsage(child_id);
  if (used >= DAILY_LIMIT) return { allowed: false, used };
  const newUsed = await incTodayUsage(child_id);
  return { allowed: true, used: newUsed };
}

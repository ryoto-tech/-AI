import { Router } from 'express';

export const router = Router();

// Simple in-memory usage tracking keyed by child_id + YYYY-MM-DD (UTC)
const usage = new Map<string, { question_count: number }>();
const DAILY_LIMIT = 3;

function key(child_id: string) {
  const d = new Date().toISOString().slice(0, 10);
  return `${child_id}:${d}`;
}

router.get('/today', (req, res) => {
  const child_id = (req.query.child_id as string) || '';
  if (!child_id) return res.status(400).json({ error: 'child_id required' });
  const k = key(child_id);
  const used = usage.get(k)?.question_count || 0;
  res.json({ question_count: used, limit: DAILY_LIMIT, resets_at: new Date(new Date().setUTCHours(24,0,0,0)).toISOString() });
});

export function checkAndInc(child_id: string) {
  const k = key(child_id);
  const entry = usage.get(k) || { question_count: 0 };
  if (entry.question_count >= DAILY_LIMIT) return { allowed: false, used: entry.question_count };
  entry.question_count += 1;
  usage.set(k, entry);
  return { allowed: true, used: entry.question_count };
}

import { prisma } from './db';

export const DAILY_LIMIT = 3;

function todayStr() {
  return new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
}

export async function getTodayUsage(child_id: string) {
  const date = todayStr();
  const rec = await prisma.usageTracking.findUnique({ where: { child_id_date: { child_id, date } } });
  return rec?.question_count || 0;
}

export async function incTodayUsage(child_id: string) {
  const date = todayStr();
  const rec = await prisma.usageTracking.upsert({
    where: { child_id_date: { child_id, date } },
    create: { child_id, date, question_count: 1 },
    update: { question_count: { increment: 1 } },
  });
  return rec.question_count;
}

export function resetTimeISO() {
  return new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString();
}

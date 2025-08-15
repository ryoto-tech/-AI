import { classify } from './classifier';

export type ParsedAI = { answer_text: string; category: '動物'|'自然'|'科学'|'日常'|'その他'; related_question: string };

export function parseChildAIResponse(content: string, fallbackInputText: string): ParsedAI {
  // Try JSON first
  try {
    const obj = JSON.parse(content);
    const answer_text = String(obj.本文 || obj.answer || obj.text || '').trim();
    const categoryRaw = String(obj.カテゴリ || obj.category || '').trim();
    const related_question = String(obj.関連質問 || obj.related_question || '').trim();
    const category = normalizeCategory(categoryRaw) || classify(fallbackInputText);
    if (answer_text) return { answer_text, category, related_question: related_question || defaultRelated() };
  } catch {}

  // Try to find lines
  const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let answer_text = '';
  let categoryText = '';
  let related_question = '';
  for (const l of lines) {
    if (!answer_text && !/^[-・]/.test(l)) answer_text = l.replace(/^本文[:：]\s*/, '').trim();
    const catMatch = l.match(/カテゴリ[:：]?\s*(?:\[?)(動物|自然|科学|日常|その他)(?:\])?/);
    if (catMatch) categoryText = catMatch[1];
    const rel = l.match(/関連質問[:：]?\s*(.+)$/);
    if (rel) related_question = rel[1].trim();
  }
  if (!answer_text && lines.length) answer_text = lines[0];
  const category = (normalizeCategory(categoryText) as any) || classify(fallbackInputText);
  return { answer_text: (answer_text || defaultAnswer()).trim(), category, related_question: related_question || defaultRelated() };
}

function normalizeCategory(v?: string) {
  if (!v) return '';
  const m = v.match(/(動物|自然|科学|日常|その他)/);
  return (m?.[1] || '') as any;
}

export function defaultAnswer() {
  return 'やさしく説明するね。パパやママにも聞いてみてね。';
}
export function defaultRelated() {
  return 'ほかのことも知りたい？';
}

export function ensureChildSafeAnswer(text: string): string {
  // keep it short: max 2 sentences
  const sentences = text.split(/[。!?！？」]/).filter(Boolean);
  const trimmed = sentences.slice(0, 2).join('。').trim();
  return trimmed ? trimmed + '。' : defaultAnswer();
}

export type AIProvider = 'mock' | 'openai';

export type AIResult = {
  answer_text: string;
  category: '動物'|'自然'|'科学'|'日常'|'その他';
  related_question: string;
};

import { classify } from '../utils/classifier';
import { safetyGuard } from './safety';

import { config } from '../utils/config';

export async function generateAnswerForChild(inputText: string, age: number = 4, provider: AIProvider = config.aiProvider() as AIProvider): Promise<AIResult> {
  const safety = safetyGuard(inputText);
  if (!safety.allowed) {
    return {
      answer_text: safety.message,
      category: 'その他',
      related_question: 'パパやママといっしょに、たのしいお話をさがしてみようか？'
    };
  }

  if (provider === 'mock') {
    const answer_text = '空には光があたって、青い色がいちばん見えやすいからだよ。';
    return { answer_text, category: classify(inputText), related_question: 'ほかの色はどう見えるのかも知りたい？' };
  }

  if (provider === 'openai') {
    const apiKey = config.openaiKey();
    if (!apiKey) throw new Error('OPENAI_API_KEY required');
    const sys = `あなたは「なぜなぜAI」の優しいくまさんです。3-6歳の子どもの質問に、次のガイドラインで答えてください:\n1) やさしいことば 2) 前向き 3) 危険回避 4) 1-2文 5) 必要なら「パパやママに聞いてね」 6) 興味を広げる関連質問\n回答形式:\n- 本文：子ども向けの回答\n- カテゴリ：[動物/自然/科学/日常/その他]\n- 関連質問：「○○についても知りたい？」`;
    const user = `質問: ${inputText}\n年齢: ${age}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: config.openaiModel(),
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ],
        temperature: 0.6,
        max_tokens: 120
      })
    });
    if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`);
    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content || '';
    // Robust parse and safety post-process
    const { parseChildAIResponse, ensureChildSafeAnswer } = await import('../utils/ai_parse');
    const parsed = parseChildAIResponse(content, inputText);
    return { answer_text: ensureChildSafeAnswer(parsed.answer_text), category: parsed.category, related_question: parsed.related_question };
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

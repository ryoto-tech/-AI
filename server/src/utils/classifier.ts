export function classify(text: string): '動物'|'自然'|'科学'|'日常'|'その他' {
  const t = text;
  if (/(いぬ|ねこ|くま|どうぶつ|動物)/i.test(t)) return '動物';
  if (/(そら|やま|はな|自然|天気|空|山|海)/i.test(t)) return '自然';
  if (/(なぜ|どうして|ひかり|でんき|科学|星|宇宙)/i.test(t)) return '科学';
  if (/(ごはん|おふろ|あそぶ|日常|ようちえん)/i.test(t)) return '日常';
  return 'その他';
}

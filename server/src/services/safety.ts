export function safetyGuard(text: string): { allowed: boolean; message?: string } {
  const ngPatterns = [
    /ばくだん|爆弾|殺す|しぬ|死ぬ|ナイフ/i,
    /住所|でんわばんごう|電話番号|クレジットカード/i,
  ];
  for (const p of ngPatterns) {
    if (p.test(text)) {
      return { allowed: false, message: 'その話題は危ないかもしれないよ。パパやママに聞いてみてね。' };
    }
  }
  // limit length to keep 1-2 sentences
  if (text.length > 200) {
    return { allowed: false, message: 'むずかしいお話みたい。もう少しみじかく聞いてみてね。' };
  }
  return { allowed: true };
}

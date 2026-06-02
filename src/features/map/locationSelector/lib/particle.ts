/**
 * 한국어 방향 조사(으로/로)를 고른다.
 * 마지막 글자에 받침이 없거나 ㄹ 받침이면 '로', 그 외에는 '으로'.
 * (예: 부산 → 으로, 진해 → 로, 전국 → 으로)
 */
export function directionParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절 영역(가~힣)이 아니면 '로'.
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return '로';
  const jong = (code - 0xac00) % 28;
  // jong === 0: 받침 없음, jong === 8: ㄹ 받침 → '로'.
  return jong === 0 || jong === 8 ? '로' : '으로';
}

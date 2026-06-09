import { formatKstIso } from '@/lib/timeUtils';

/** epoch ms → "MM/DD HH:mm" (KST wall-clock). markLine 라벨용 간략 표기. */
export function formatKstLabel(ms: number): string {
  // formatKstIso: "YYYY-MM-DDTHH:MM:SS" (KST). 월/일 + 시:분만 추린다.
  const iso = formatKstIso(ms);
  const [date, time] = iso.split('T');
  const [, mm, dd] = date.split('-');
  const [hh, min] = time.split(':');
  return `${mm}/${dd} ${hh}:${min}`;
}

/**
 * 현재 시나리오 timestamp를 가리키는 세로 수직선 markLine. 기본 라벨은 선 끝(top)에 그려져
 * 우측 끝일 때 잘리므로, 그리드 안쪽(insideEndTop)에 KST 시각을 포맷해 표시한다.
 * currentMs가 null이면 undefined(= markLine 미표시).
 */
export function currentTimeMarkLine(currentMs: number | null) {
  if (currentMs == null) return undefined;
  return {
    symbol: 'none' as const,
    silent: true,
    lineStyle: { color: '#e7eaef', type: 'dashed' as const, width: 1 },
    label: {
      show: true,
      position: 'insideEndTop' as const,
      formatter: () => formatKstLabel(currentMs),
      color: '#e7eaef',
      backgroundColor: '#212226cc',
      padding: [2, 4] as [number, number],
      borderRadius: 3,
      fontSize: 10,
    },
    data: [{ xAxis: currentMs }],
  };
}

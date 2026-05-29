const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** "2003-09-04T00:00:00" (KST, timezone 표기 없음) → epoch ms */
export function parseKstNaive(s: string): number {
  return new Date(`${s}+09:00`).getTime();
}

/** epoch ms에 9시간을 더한 뒤 ISO 문자열로 변환 (KST wall-clock, ms/Z 생략) */
export function formatKstIso(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * [firstTime, lastTime] 범위 안에서 1시간 간격으로 스냅한,
 * 현재 시각에 가장 가까운 timestamp를 KST ISO 문자열로 반환한다.
 * 현재 시각이 범위 밖이면 first 또는 last로 클램프.
 */
export function nearestHourlyTimestamp(
  firstTime: string,
  lastTime: string,
): string {
  const start = parseKstNaive(firstTime);
  const end = parseKstNaive(lastTime);
  const clamped = Math.max(start, Math.min(end, Date.now()));
  const steps = Math.round((clamped - start) / HOUR_MS);
  return formatKstIso(start + steps * HOUR_MS);
}

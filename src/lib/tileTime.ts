/**
 * 타일 시계열 인덱스: 현재로부터 7일치를 1시간 간격으로 끊은 168개.
 * index 0 = 현재, index 167 = +167시간.
 */
export const TILE_TIME_INDEX_COUNT = 168;
export const TILE_TIME_STEP_MS = 60 * 60 * 1000;

/** timeIndex(0-based)에 해당하는 시각을 반환한다. */
export function tileTimeAt(timeIndex: number, origin: Date = new Date()): Date {
  return new Date(origin.getTime() + timeIndex * TILE_TIME_STEP_MS);
}

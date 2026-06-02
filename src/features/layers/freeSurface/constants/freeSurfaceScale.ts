import { oceanColorMap } from '@/lib/colorMap';
import type { ColorBarSpec } from '@/features/layers/core/colorBar';

// 자유수면 높이(m) 색 매핑 범위. fetcher와 컬러바가 공유한다.
// oceanColorMap이 한쪽 끝에 오도록 min>max로 둬서 색 방향을 뒤집는다(선형).
export const FREE_SURFACE_MIN = 7;
export const FREE_SURFACE_MAX = -7;

// 컬러바 라벨로 찍을 실제 높이값(m).
export const FREE_SURFACE_TICKS = [7, 5, 3, 1, 0, -1, -3, -5, -7];

export const freeSurfaceColorBarSpec: ColorBarSpec = {
  label: '자유수면 (m)',
  colorMap: oceanColorMap,
  min: FREE_SURFACE_MIN,
  max: FREE_SURFACE_MAX,
  ticks: FREE_SURFACE_TICKS,
};

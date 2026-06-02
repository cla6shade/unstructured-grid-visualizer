import { waveColorMap } from '@/lib/colorMap';
import type { ColorBarSpec } from '@/features/layers/core/colorBar';

// 파고(WH, m) 색 매핑 범위. fetcher(LUT)와 컬러바가 공유한다.
// waveColorMap: 낮은 값=파랑(잔잔), 높은 값=노랑(큰 파고) + asinh(저파고 해상도 ↑).
// TODO: 실 데이터로 범위/asinh scale 튜닝 필요.
export const WAVE_HEIGHT_MIN = 0;
export const WAVE_HEIGHT_MAX = 10;

// 컬러바에 라벨로 찍을 실제 파고값(m). 0~1 구간을 조밀하게 둔다.
export const WAVE_HEIGHT_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1, 2, 4, 6, 8, 10];

export const waveHeightColorBarSpec: ColorBarSpec = {
  label: '파고 (m)',
  colorMap: waveColorMap,
  min: WAVE_HEIGHT_MIN,
  max: WAVE_HEIGHT_MAX,
  ticks: WAVE_HEIGHT_TICKS,
};

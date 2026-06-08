import { buildColorLut, currentSpeedColorMap, type ColorLut } from '@/lib/colorMap';
import type { ColorBarSpec } from '@/features/layers/core/colorBar';

// 해류 유속(speed = |(u, v)|, m/s) 범위. 라인 색과 컬러바가 공유한다.
// 방향만 뒤집은(낮음=파랑) currentSpeedColorMap을 linear로 매핑한다.
export const MIN_SPEED = 0;
export const MAX_SPEED = 2.5;
export const SPEED_LUT_SIZE = 256;

// 유속 → 색 LUT. useFlowLines가 매 프레임 인덱스 조회만 하도록 미리 만든다.
export const CURRENT_SPEED_LUT: ColorLut = buildColorLut(
  currentSpeedColorMap,
  MIN_SPEED,
  MAX_SPEED,
  SPEED_LUT_SIZE,
);

// 컬러바 tick(m/s). linear 매핑이라 화면상 간격도 등간격이다.
export const SPEED_TICKS = [0, 0.5, 1, 1.5, 2, 2.5];

export const currentColorBarSpec: ColorBarSpec = {
  label: '유속 (m/s)',
  colorMap: currentSpeedColorMap,
  min: MIN_SPEED,
  max: MAX_SPEED,
  ticks: SPEED_TICKS,
};

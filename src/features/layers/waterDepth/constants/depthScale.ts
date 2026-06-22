import { depthColorMap } from '@/lib/colorMap';
import type { ColorBarSpec } from '@/features/layers/shared/colorBar';

// 수심 값 범위. fetcher(LUT)와 컬러바가 공유한다. asinh 매핑 자체는
// depthColorMap이 들고 있다(@/lib/colorMap).
export const MIN_DEPTH = 0;
export const MAX_DEPTH = 10_000;
export const DEPTH_LUT_SIZE = 512;

// 컬러바에 라벨로 찍을 실제 수심값(m). asinh 매핑이라 화면상 간격은 등간격이
// 아니며, 위치는 컬러맵 scale 기준으로 계산한다.
export const DEPTH_TICKS = [
  0, 1, 2, 5, 10, 30, 100, 300, 1000, 3000, 6000, 10_000,
];

export const depthColorBarSpec: ColorBarSpec = {
  label: '수심 (m)',
  colorMap: depthColorMap,
  min: MIN_DEPTH,
  max: MAX_DEPTH,
  ticks: DEPTH_TICKS,
};

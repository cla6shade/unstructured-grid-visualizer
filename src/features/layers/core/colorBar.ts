import type { ColorMap } from '@/lib/colorMap';
import type { LayerId } from '@/features/layers/core/registry';
import { freeSurfaceColorBarSpec } from '@/features/layers/freeSurface/constants/freeSurfaceScale';
import { depthColorBarSpec } from '@/features/layers/waterDepth/constants/depthScale';
import { waveHeightColorBarSpec } from '@/features/layers/wave/constants/waveHeightScale';

// 컬러바 한 개를 그리는 데 필요한 값↔색 정보. 비선형 매핑(scale)은 colorMap이
// 들고 있어, min/max만 맞추면 컬러바가 실제 렌더 색·tick 위치와 일치한다.
export interface ColorBarSpec {
  label: string;
  colorMap: ColorMap;
  min: number;
  max: number;
  ticks: number[];
}

// 레이어별 컬러바. 여기에 없는 레이어(vector/flow 등)는 컬러바를 그리지 않는다.
export const LAYER_COLOR_BARS: Partial<Record<LayerId, ColorBarSpec>> = {
  freeSurface: freeSurfaceColorBarSpec,
  waterDepth: depthColorBarSpec,
  wave: waveHeightColorBarSpec,
};

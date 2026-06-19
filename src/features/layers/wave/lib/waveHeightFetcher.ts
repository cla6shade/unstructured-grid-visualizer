import {
  buildColorLut,
  maskBoundaryZeroAlpha,
  valuesToRgbaFloat32,
  waveColorMap,
} from '@/lib/colorMap';
import type { ContourTileFetcher } from '@/features/contour/types';
import {
  WAVE_HEIGHT_MAX,
  WAVE_HEIGHT_MIN,
} from '@/features/layers/wave/constants/waveHeightScale';
import { waveSource } from './waveSource';

// 파고(WH) → 색. waveColorMap asinh, 0..10m. 낮은 값=파랑, 높은 값=노랑.
const LUT = buildColorLut(waveColorMap, WAVE_HEIGHT_MIN, WAVE_HEIGHT_MAX);

/**
 * Wave height(WH) contour fetcher. wave values 타일의 WH를 색으로 변환한다.
 * mesh/values URL·키는 waveSource를 공유(파향 fetcher와 동일 타일).
 */
export const waveHeightFetcher: ContourTileFetcher = {
  ...waveSource,
  // transparentValue=null로 값 0도 렌더하되, boundary(육지) 노드의 0만 투명 처리한다.
  toColors: (values, boundaryMask) => {
    const wh = values['WH'];
    const rgba = valuesToRgbaFloat32(wh, LUT, null);
    return maskBoundaryZeroAlpha(rgba, wh, boundaryMask);
  },
};

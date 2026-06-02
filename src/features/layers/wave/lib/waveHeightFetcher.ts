import {
  buildColorLut,
  valuesToRgbaFloat32,
  waveColorMap,
} from '@/lib/colorMap';
import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';
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
  // freeSurface와 동일하게 transparentValue=null로 0도 렌더한다.
  // TODO: 0이 무자료(육지 등)로 들어오면 transparentValue=0으로 바꿔 투명 처리.
  toColors: (values) => {
    const wh = values['WH'];
    queueMicrotask(() =>
      useDebugStatsStore.getState().report('wave', 'WH', wh),
    );
    return valuesToRgbaFloat32(wh, LUT, null);
  },
};

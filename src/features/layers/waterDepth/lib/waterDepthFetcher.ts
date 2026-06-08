import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import {
  buildColorLut,
  depthColorMap,
  valuesToRgbaFloat32,
} from '@/lib/colorMap';
import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';
import type { ContourTileFetcher } from '@/features/contour/types';
import {
  DEPTH_LUT_SIZE,
  MAX_DEPTH,
  MIN_DEPTH,
} from '@/features/layers/waterDepth/constants/depthScale';

const LAYER = 'height';

// asinh 매핑(얕은 수심 강조)은 depthColorMap이 들고 있다.
const LUT = buildColorLut(depthColorMap, MIN_DEPTH, MAX_DEPTH, DEPTH_LUT_SIZE);

export const waterDepthFetcher: ContourTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.water_depth,
  meshUrl: ({ x, y }, { location }) => `/api/subset/mesh/${location}/${x}/${y}`,
  meshKey: ({ x, y }, { location }) => [location, 'mesh', x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    `/api/subset/${typhoonId}/${location}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    [location, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toColors: (values) => {
    const s = values['H'];
    queueMicrotask(() =>
      useDebugStatsStore.getState().report('waterDepth', 'H', s),
    );
    return valuesToRgbaFloat32(s, LUT);
  },
};

import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import {
  buildColorLut,
  depthColorMap,
  valuesToRgbaFloat32,
} from '@/lib/colorMap';
import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';
import type { ContourTileFetcher } from '@/features/contour/types';

const LOCATION = 'korea';
const LAYER = 'height';
// TODO: 색상 정규화 범위는 실 데이터로 튜닝 필요.
const LUT = buildColorLut(depthColorMap, 0, 10_000);

export const waterDepthFetcher: ContourTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.water_depth,
  meshUrl: ({ x, y }) => `/api/subset/mesh/${LOCATION}/${LAYER}/${x}/${y}`,
  meshKey: ({ x, y }) => [LOCATION, 'mesh', LAYER, x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    `/api/subset/${typhoonId}/${LOCATION}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    [LOCATION, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toColors: (values) => {
    const s = values['H'];
    queueMicrotask(() =>
      useDebugStatsStore.getState().report('waterDepth', 'H', s),
    );
    return valuesToRgbaFloat32(s, LUT);
  },
};

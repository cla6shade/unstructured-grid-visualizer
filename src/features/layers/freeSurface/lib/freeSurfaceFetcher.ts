import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import {
  buildColorLut,
  oceanColorMap,
  valuesToRgbaFloat32,
} from '@/lib/colorMap';
import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';
import type { ContourTileFetcher } from '@/features/contour/types';
import {
  FREE_SURFACE_MAX,
  FREE_SURFACE_MIN,
} from '@/features/layers/freeSurface/constants/freeSurfaceScale';

const LOCATION = 'korea';
const LAYER = 'tidal_height';
// TODO: 색상 정규화 범위는 실 데이터로 튜닝 필요.
// oceanColorMap은 노랑→파랑 순서. 높은 값=노랑이 되도록 min/max를 뒤집어 LUT 생성.
const LUT = buildColorLut(oceanColorMap, FREE_SURFACE_MIN, FREE_SURFACE_MAX);

export const freeSurfaceFetcher: ContourTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.tidal_height,
  meshUrl: ({ x, y }) => `/api/subset/mesh/${LOCATION}/${LAYER}/${x}/${y}`,
  meshKey: ({ x, y }) => [LOCATION, 'mesh', LAYER, x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    `/api/subset/${typhoonId}/${LOCATION}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    [LOCATION, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toColors: (values) => {
    const s = values['S'];
    queueMicrotask(() =>
      useDebugStatsStore.getState().report('freeSurface', 'S', s),
    );
    return valuesToRgbaFloat32(s, LUT, null);
  },
};

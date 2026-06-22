import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import {
  buildColorLut,
  maskBoundaryZeroAlpha,
  oceanColorMap,
  valuesToRgbaFloat32,
} from '@/lib/colorMap';
import type { ContourTileFetcher } from '@/features/layers/shared/surface/types';
import {
  FREE_SURFACE_MAX,
  FREE_SURFACE_MIN,
} from '@/features/layers/freeSurface/constants/freeSurfaceScale';

const LAYER = 'tidal_height';
// TODO: 색상 정규화 범위는 실 데이터로 튜닝 필요.
// oceanColorMap은 노랑→파랑 순서. 높은 값=노랑이 되도록 min/max를 뒤집어 LUT 생성.
const LUT = buildColorLut(oceanColorMap, FREE_SURFACE_MIN, FREE_SURFACE_MAX);

export const freeSurfaceFetcher: ContourTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.tidal_height,
  meshUrl: ({ x, y }, { location }) => `/api/subset/mesh/${location}/${x}/${y}`,
  meshKey: ({ x, y }, { location }) => [location, 'mesh', x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    `/api/subset/${typhoonId}/${location}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    [location, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toColors: (values, boundaryMask) => {
    const s = values['S'];
    const rgba = valuesToRgbaFloat32(s, LUT, null);
    return maskBoundaryZeroAlpha(rgba, s, boundaryMask);
  },
};

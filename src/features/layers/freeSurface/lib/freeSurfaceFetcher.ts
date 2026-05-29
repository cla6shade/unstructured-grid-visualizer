import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import { oceanColorMap } from '@/lib/colorMap';
import type { ContourTileFetcher } from '@/features/contour/types';

const LOCATION = 'korea';
const LAYER = 'tidal_height';
// TODO: 색상 정규화 범위는 실 데이터로 튜닝 필요.
const S_MIN = -7;
const S_MAX = 7;

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
    const out = new Float32Array(s.length * 4);
    for (let i = 0; i < s.length; i++) {
      // 높은 값 = 노랑. oceanColorMap stop 순서가 노랑→파랑이라 min/max를 뒤집어 호출.
      const [r, g, b, a] = oceanColorMap(s[i], S_MAX, S_MIN);
      out[i * 4] = r / 255;
      out[i * 4 + 1] = g / 255;
      out[i * 4 + 2] = b / 255;
      out[i * 4 + 3] = a / 255;
    }
    return out;
  },
};

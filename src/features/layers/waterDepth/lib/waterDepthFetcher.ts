import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import { oceanColorMap } from '@/lib/colorMap';
import type { ContourTileFetcher } from '@/features/contour/types';

const LOCATION = 'korea';
const LAYER = 'height';
// TODO: 색상 정규화 범위는 실 데이터로 튜닝 필요.
const S_MIN = -7;
const S_MAX = 7;

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
    const out = new Float32Array(s.length * 4);
    for (let i = 0; i < s.length; i++) {
      // 0인 노드는 렌더링되지 않도록 alpha를 0으로 둔다.
      if (s[i] === 0) continue;
      const [r, g, b, a] = oceanColorMap(s[i], S_MAX, S_MIN);
      out[i * 4] = r / 255;
      out[i * 4 + 1] = g / 255;
      out[i * 4 + 2] = b / 255;
      out[i * 4 + 3] = a / 255;
    }
    return out;
  },
};

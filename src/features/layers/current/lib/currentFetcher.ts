import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import type { VectorTileFetcher } from '@/features/vector/types';

const LOCATION = 'korea';
const LAYER = 'current';

/**
 * Current(해류) 레이어 fetcher. mesh는 다른 contour 레이어와 동일 규약,
 * values 타일에서 (U, V)를 받아 노드별 [u, v] interleave 버퍼로 변환한다.
 */
export const currentFetcher: VectorTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.current,
  meshUrl: ({ x, y }) => `/api/subset/mesh/${LOCATION}/${LAYER}/${x}/${y}`,
  meshKey: ({ x, y }) => [LOCATION, 'mesh', LAYER, x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    `/api/subset/${typhoonId}/${LOCATION}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp }) =>
    [LOCATION, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toVectors: (values) => {
    const u = values['U'];
    const v = values['V'];
    const n = u.length;
    const out = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      out[i * 2] = u[i];
      out[i * 2 + 1] = v[i];
    }
    return out;
  },
};

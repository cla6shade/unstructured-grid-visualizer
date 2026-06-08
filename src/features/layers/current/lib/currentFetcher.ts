import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';
import type { VectorTileFetcher } from '@/features/vector/types';

const LAYER = 'current';

/**
 * Current(해류) 레이어 fetcher. mesh는 다른 contour 레이어와 동일 규약,
 * values 타일에서 (U, V)를 받아 노드별 [u, v] interleave 버퍼로 변환한다.
 */
export const currentFetcher: VectorTileFetcher = {
  valueKeys: LAYER_VALUE_KEYS.surge.current,
  meshUrl: ({ x, y }, { location }) =>
    `/api/subset/mesh/${location}/${LAYER}/${x}/${y}`,
  meshKey: ({ x, y }, { location }) => [location, 'mesh', LAYER, x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    `/api/subset/${typhoonId}/${location}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    [location, scenarioId, LAYER, typhoonId, timestamp, x, y],
  toVectors: (values) => {
    const u = values['U'];
    const v = values['V'];
    const n = u.length;
    const out = new Float32Array(n * 2);
    // 디버그 오버레이용 유속(|(u, v)|, m/s) 분포. 라인 색이 이 값을 쓴다.
    const speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      out[i * 2] = u[i];
      out[i * 2 + 1] = v[i];
      speed[i] = Math.hypot(u[i], v[i]);
    }
    queueMicrotask(() =>
      useDebugStatsStore.getState().report('current', 'speed', speed),
    );
    return out;
  },
};

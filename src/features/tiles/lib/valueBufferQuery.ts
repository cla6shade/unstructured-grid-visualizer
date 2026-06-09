import type { QueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';
import { fetchMeshTile } from '@/features/mesh/lib/fetchMeshTile';
import { fetchValuesTile } from './fetchValuesTile';
import type { FetcherCtx, TileSource } from '../types';

export type ValueBufferTransform = (
  values: ValuesTile['values'],
  boundaryMask: Uint8Array,
) => Float32Array;

/**
 * values 타일 하나의 react-query 쿼리 설정을 만든다.
 * 키는 source.valuesKey(coord, ctx) + tag — (location, layer, scenario, timestamp, tile)별로
 * transform 1회만 실행된다. useQueries(렌더용 구독)와 prefetchQuery(캐시 워밍)가 공유해
 * 키/로직이 어긋나지 않게 한 곳에 둔다.
 */
export function valueBufferQuery(
  qc: QueryClient,
  coord: TileCoord,
  source: TileSource,
  ctx: FetcherCtx,
  transform: ValueBufferTransform,
  tag: string,
) {
  const valuesKey = source.valuesKey(coord, ctx);
  const valuesUrl = source.valuesUrl(coord, ctx);
  const meshKey = source.meshKey(coord, ctx);
  const meshUrl = source.meshUrl(coord, ctx);
  return {
    queryKey: [...valuesKey, tag] as const,
    queryFn: async () => {
      const values = await qc.fetchQuery({
        queryKey: valuesKey,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchValuesTile(valuesUrl, source.valueKeys, signal),
        staleTime: Infinity,
      });
      if (!values) return null;
      // mesh의 boundary_node(육지 노드 전역 인덱스)로 로컬 노드별 마스크를 만든다.
      // mesh는 geometry라 timestamp 무관 — useDerivedMeshTiles와 같은 키로 캐시 공유.
      const mesh = await qc.fetchQuery({
        queryKey: meshKey,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchMeshTile(meshUrl, signal),
        staleTime: Infinity,
      });
      const boundaryMask = new Uint8Array(values.node.length);
      if (mesh && mesh.boundaryNode.length > 0) {
        const boundary = new Set(mesh.boundaryNode);
        for (let i = 0; i < values.node.length; i++) {
          if (boundary.has(values.node[i])) boundaryMask[i] = 1;
        }
      }
      return transform(values.values, boundaryMask);
    },
    staleTime: Infinity,
  };
}

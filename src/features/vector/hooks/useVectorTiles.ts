import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import { fetchValuesTile } from '@/features/contour/lib/fetchValuesTile';
import { deriveVectors } from '../lib/deriveVectors';
import type { FetcherCtx, VectorTileFetcher } from '../types';

/**
 * values 타일별로 (u, v) 버퍼를 react-query 캐시에 담는다.
 * 키는 fetcher.valuesKey(coord, ctx) + 'vectors' — (location, layer, scenario, timestamp, tile)별로
 * toVectors 1회만 실행되며 timestamp 변경 시 새로 보이는 타일에 대해서만 재계산된다.
 *
 * 반환 배열의 각 원소는 length = nodeCount * 2 의 Float32Array 또는 undefined.
 * mesh와 인덱스가 1:1 매칭됨을 가정. useColoredTiles의 벡터판.
 */
export function useVectorTiles(
  tiles: TileCoord[],
  fetcher: VectorTileFetcher,
  ctx: FetcherCtx,
): readonly (Float32Array | undefined)[] {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) => {
      const valuesKey = fetcher.valuesKey(coord, ctx);
      const valuesUrl = fetcher.valuesUrl(coord, ctx);
      return {
        queryKey: [...valuesKey, 'vectors'] as const,
        queryFn: async () => {
          const values = await qc.fetchQuery({
            queryKey: valuesKey,
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              fetchValuesTile(valuesUrl, fetcher.valueKeys, signal),
            staleTime: Infinity,
          });
          return values ? deriveVectors(fetcher, values) : null;
        },
        staleTime: Infinity,
      };
    }),
  });

  const fingerprint = results
    .map((r, i) => `${tiles[i].x},${tiles[i].y}:${r.dataUpdatedAt ?? 0}`)
    .join('|');

  return useMemo<readonly (Float32Array | undefined)[]>(
    () => results.map((r) => r.data ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );
}

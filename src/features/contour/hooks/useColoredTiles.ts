import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import { fetchValuesTile } from '../lib/fetchValuesTile';
import { deriveColors } from '../lib/tileDerive';
import type { ContourTileFetcher, FetcherCtx } from '../types';

/**
 * values 타일별로 RGBA 색상 버퍼를 react-query 캐시에 담는다.
 * 키는 fetcher.valuesKey(coord, ctx) + 'colors' — (location, layer, scenario, timestamp, tile)별로
 * toColors 1회만 실행되며 timestamp 변경 시 새로 보이는 타일에 대해서만 재계산된다.
 *
 * 반환 배열의 각 원소는 length = nodeCount * 4의 Float32Array 또는 undefined.
 * mesh와 인덱스가 1:1 매칭됨을 가정.
 */
export function useColoredTiles(
  tiles: TileCoord[],
  fetcher: ContourTileFetcher,
  ctx: FetcherCtx,
): readonly (Float32Array | undefined)[] {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) => {
      const valuesKey = fetcher.valuesKey(coord, ctx);
      const valuesUrl = fetcher.valuesUrl(coord, ctx);
      return {
        queryKey: [...valuesKey, 'colors'] as const,
        queryFn: async () => {
          const values = await qc.fetchQuery({
            queryKey: valuesKey,
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              fetchValuesTile(valuesUrl, fetcher.valueKeys, signal),
            staleTime: Infinity,
          });
          return values ? deriveColors(fetcher, values) : null;
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

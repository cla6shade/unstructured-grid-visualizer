import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';
import { fetchValuesTile } from '../lib/fetchValuesTile';
import type { FetcherCtx, TileSource } from '../types';

/**
 * values 타일별로 GPU 버퍼(Float32Array)를 react-query 캐시에 담는다.
 * 키는 source.valuesKey(coord, ctx) + tag — (location, layer, scenario, timestamp, tile)별로
 * transform 1회만 실행되며 timestamp 변경 시 새로 보이는 타일에 대해서만 재계산된다.
 *
 * contour(색상, stride 4)와 vector((u,v), stride 2)가 transform/tag만 바꿔 공유한다.
 * 반환 배열은 tiles와 인덱스 1:1 — 아직 도착하지 않은 타일은 undefined.
 *
 * @param transform  디코딩된 values를 버퍼로 변환(예: fetcher.toColors / fetcher.toVectors).
 * @param tag        캐시 키 접미사로 색/벡터 캐시를 분리('colors' | 'vectors').
 */
export function useValueBufferTiles(
  tiles: TileCoord[],
  source: TileSource,
  ctx: FetcherCtx,
  transform: (values: ValuesTile['values']) => Float32Array,
  tag: string,
): readonly (Float32Array | undefined)[] {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) => {
      const valuesKey = source.valuesKey(coord, ctx);
      const valuesUrl = source.valuesUrl(coord, ctx);
      return {
        queryKey: [...valuesKey, tag] as const,
        queryFn: async () => {
          const values = await qc.fetchQuery({
            queryKey: valuesKey,
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              fetchValuesTile(valuesUrl, source.valueKeys, signal),
            staleTime: Infinity,
          });
          return values ? transform(values.values) : null;
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

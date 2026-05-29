import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';
import { fetchValuesTile } from '../lib/fetchValuesTile';
import type { ContourTileFetcher, FetcherCtx } from '../types';

/**
 * mesh와 짝을 이루는 values 타일을 useQueries로 구독한다.
 * 반환 배열은 tiles와 인덱스 1:1 — 아직 도착하지 않은 타일은 undefined.
 */
export function useValuesTiles(
  tiles: TileCoord[],
  fetcher: ContourTileFetcher,
  ctx: FetcherCtx,
): readonly (ValuesTile | undefined)[] {
  const results = useQueries({
    queries: tiles.map((coord) => ({
      queryKey: fetcher.valuesKey(coord, ctx),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchValuesTile(fetcher.valuesUrl(coord, ctx), fetcher.valueKeys, signal),
      staleTime: Infinity,
    })),
  });

  const fingerprint = results
    .map((r, i) => `${tiles[i].x},${tiles[i].y}:${r.dataUpdatedAt ?? 0}`)
    .join('|');

  return useMemo<readonly (ValuesTile | undefined)[]>(
    () => results.map((r) => r.data ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );
}

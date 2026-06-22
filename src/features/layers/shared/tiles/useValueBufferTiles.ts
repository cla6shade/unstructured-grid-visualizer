import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';
import { valueBufferQuery } from './valueBufferQuery';
import type { FetcherCtx, TileSource } from './types';

export interface ValueBufferTiles {
  buffers: readonly (Float32Array | undefined)[];
  /** 보이는 모든 values 타일 쿼리가 settle 됐는지(빈 타일 포함). 단일 출처: react-query status. */
  isLoaded: boolean;
}

/**
 * values 타일별로 GPU 버퍼(Float32Array)를 react-query 캐시에 담는다.
 * 키는 source.valuesKey(coord, ctx) + tag — (location, layer, scenario, timestamp, tile)별로
 * transform 1회만 실행되며 timestamp 변경 시 새로 보이는 타일에 대해서만 재계산된다.
 *
 * contour(색상, stride 4)와 vector((u,v), stride 2)가 transform/tag만 바꿔 공유한다.
 * 반환 buffers는 tiles와 인덱스 1:1 — 아직 도착하지 않은 타일은 undefined.
 *
 * @param transform  디코딩된 values를 버퍼로 변환(예: fetcher.toColors / fetcher.toVectors).
 *                   boundaryMask는 로컬 노드별 boundary(육지) 여부(1/0) — toColors가 쓴다.
 * @param tag        캐시 키 접미사로 색/벡터 캐시를 분리('colors' | 'vectors').
 */
export function useValueBufferTiles(
  tiles: TileCoord[],
  source: TileSource,
  ctx: FetcherCtx,
  transform: (
    values: ValuesTile['values'],
    boundaryMask: Uint8Array,
  ) => Float32Array,
  tag: string,
): ValueBufferTiles {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) =>
      valueBufferQuery(qc, coord, source, ctx, transform, tag),
    ),
  });

  const fingerprint = results
    .map((r, i) => `${tiles[i].x},${tiles[i].y}:${r.dataUpdatedAt ?? 0}`)
    .join('|');

  const buffers = useMemo<readonly (Float32Array | undefined)[]>(
    () => results.map((r) => r.data ?? undefined),
    [fingerprint],
  );

  const isLoaded = tiles.length > 0 && results.every((r) => !r.isPending);

  return { buffers, isLoaded };
}

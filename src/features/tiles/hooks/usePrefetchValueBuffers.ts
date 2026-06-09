import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import {
  valueBufferQuery,
  type ValueBufferTransform,
} from '../lib/valueBufferQuery';
import type { FetcherCtx, TileSource } from '../types';

/**
 * 주어진 ctx(보통 다음 timestamp)의 값 버퍼 타일을 react-query 캐시에 미리 채운다.
 * prefetchQuery는 구독/리렌더 없이 캐시만 워밍하므로, 재생이 다음 스텝으로 넘어가면
 * 동일 키가 캐시 히트되어 즉시 렌더된다. 같은 키가 in-flight면 react-query가 dedupe.
 *
 * useValueBufferTiles와 같은 valueBufferQuery를 쓰므로 키/transform이 어긋나지 않는다.
 */
export function usePrefetchValueBuffers(
  tiles: TileCoord[],
  source: TileSource,
  ctx: FetcherCtx,
  transform: ValueBufferTransform,
  tag: string,
  enabled: boolean,
): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || tiles.length === 0) return;
    for (const coord of tiles) {
      qc.prefetchQuery(valueBufferQuery(qc, coord, source, ctx, transform, tag));
    }
  }, [
    enabled,
    tiles,
    qc,
    source,
    transform,
    tag,
    ctx.typhoonId,
    ctx.scenarioId,
    ctx.timestamp,
    ctx.location,
  ]);
}

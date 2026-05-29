import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import type { MeshTile } from '@/lib/binaryTile';
import { fetchMeshTile } from '../lib/fetchMeshTile';

export interface MeshTileSource {
  url: (coord: TileCoord) => string;
  key: (coord: TileCoord) => readonly unknown[];
}

/**
 * 주어진 타일 좌표 목록에 대해 mesh 타일 쿼리를 useQueries로 구독한다.
 * 반환 배열은 tiles와 인덱스가 1:1 — 아직 도착하지 않은/실패한/빈 타일은 undefined.
 * react-query가 observer 기반으로 캐시·dedupe·gc를 관리하도록 위임.
 *
 * 반환 ref는 같은 내용에 대해 안정적이므로 호출자는 useMemo dep로 그대로 써도 안전.
 */
export function useMeshTiles(
  tiles: TileCoord[],
  source: MeshTileSource,
): readonly (MeshTile | undefined)[] {
  const results = useQueries({
    queries: tiles.map((coord) => ({
      queryKey: source.key(coord),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchMeshTile(source.url(coord), signal),
      staleTime: Infinity,
    })),
  });

  // useQueries 결과 객체는 매 렌더 새로 생성되지만 data ref는 react-query가
  // structural-share로 안정시킨다. dataUpdatedAt만 모아 내부 dep로 사용.
  const fingerprint = results
    .map((r, i) => `${tiles[i].x},${tiles[i].y}:${r.dataUpdatedAt ?? 0}`)
    .join('|');

  return useMemo<readonly (MeshTile | undefined)[]>(
    () => results.map((r) => (r.data && r.data.nodeCount > 0 ? r.data : undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );
}

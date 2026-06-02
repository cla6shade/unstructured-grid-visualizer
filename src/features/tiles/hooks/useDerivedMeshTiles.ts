import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import { fetchMeshTile } from '@/features/mesh/lib/fetchMeshTile';
import { deriveMesh, type DerivedMesh } from '../lib/deriveMesh';
import type { FetcherCtx, TileSource } from '../types';

/** mesh fetch에 필요한 부분만. contour/vector fetcher 모두 이를 만족한다. */
type MeshSource = Pick<TileSource, 'meshUrl' | 'meshKey'>;

/**
 * mesh 타일별로 (positions, conn, globalNodes) 파생물을 react-query 캐시에 담는다.
 * 키는 source.meshKey(coord, ctx) + 'derived' — (location, layer)별로 자연 분리되며
 * meshKey는 ctx.location만 참조하고 timestamp/scenario에는 무관해 connectivity 캐시 역할을 겸한다.
 *
 * 내부 mesh fetch는 queryClient.fetchQuery로 위임 — 동일 meshKey의 raw 캐시는
 * contour/vector가 공유한다.
 */
export interface DerivedMeshTiles {
  meshes: readonly (DerivedMesh | undefined)[];
  /** 보이는 모든 mesh 타일 쿼리가 settle 됐는지(빈 타일 포함). 단일 출처: react-query status. */
  isLoaded: boolean;
}

export function useDerivedMeshTiles(
  tiles: TileCoord[],
  source: MeshSource,
  ctx: FetcherCtx,
): DerivedMeshTiles {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) => {
      const meshKey = source.meshKey(coord, ctx);
      const meshUrl = source.meshUrl(coord, ctx);
      return {
        queryKey: [...meshKey, 'derived'] as const,
        queryFn: async () => {
          const mesh = await qc.fetchQuery({
            queryKey: meshKey,
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              fetchMeshTile(meshUrl, signal),
            staleTime: Infinity,
          });
          return mesh && mesh.nodeCount > 0 ? deriveMesh(mesh) : null;
        },
        staleTime: Infinity,
      };
    }),
  });

  const fingerprint = results
    .map((r, i) => `${tiles[i].x},${tiles[i].y}:${r.dataUpdatedAt ?? 0}`)
    .join('|');

  const meshes = useMemo<readonly (DerivedMesh | undefined)[]>(
    () => results.map((r) => r.data ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );

  const isLoaded = tiles.length > 0 && results.every((r) => !r.isPending);

  return { meshes, isLoaded };
}

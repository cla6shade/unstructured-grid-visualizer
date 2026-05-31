import { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import type { TileCoord } from '@/lib/tile';
import { fetchMeshTile } from '@/features/mesh/lib/fetchMeshTile';
import { deriveMesh, type DerivedMesh } from '../lib/tileDerive';
import type { ContourTileFetcher } from '../types';

/** mesh fetch에 필요한 부분만. ContourTileFetcher와 VectorTileFetcher 모두 이를 만족한다. */
type MeshFetcher = Pick<ContourTileFetcher, 'meshUrl' | 'meshKey'>;

/**
 * mesh 타일별로 (positions, conn, globalNodes) 파생물을 react-query 캐시에 담는다.
 * 키는 fetcher.meshKey(coord) + 'derived' — fetcher의 (location, layer)별로 자연 분리되며
 * timestamp/scenario에는 무관해 connectivity 캐시 역할을 겸한다.
 *
 * 내부 mesh fetch는 queryClient.fetchQuery로 위임 — 동일 meshKey의 raw 캐시는
 * useMeshTiles와 공유된다.
 */
export function useDerivedMeshTiles(
  tiles: TileCoord[],
  fetcher: MeshFetcher,
): readonly (DerivedMesh | undefined)[] {
  const qc = useQueryClient();
  const results = useQueries({
    queries: tiles.map((coord) => {
      const meshKey = fetcher.meshKey(coord);
      const meshUrl = fetcher.meshUrl(coord);
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

  return useMemo<readonly (DerivedMesh | undefined)[]>(
    () => results.map((r) => r.data ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );
}

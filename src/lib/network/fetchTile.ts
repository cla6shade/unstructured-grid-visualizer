import { apiFetch } from '@/lib/network/apiFetch';
import type { TileCoord } from '@/lib/tile';

export type TileFetcher<R> = (
  coord: TileCoord,
  timestamp?: string,
  signal?: AbortSignal,
) => Promise<R>;

export interface FetchTileOptions<R> {
  /** timestamp(KST ISO)는 시계열 레이어에만 사용. */
  endpoint: (coord: TileCoord, timestamp?: string) => string;
  fallback: R;
  label: string;
}

export function fetchTile<R>(opts: FetchTileOptions<R>): TileFetcher<R> {
  const { endpoint, fallback, label } = opts;
  return async (coord, timestamp, signal) => {
    try {
      const res = await apiFetch(endpoint(coord, timestamp), { signal });
      if (res.status === 404) return fallback;
      if (!res.ok) {
        console.error(
          `[${label}] tile ${coord.z}/${coord.x}/${coord.y} failed`,
          res.status,
        );
        return fallback;
      }
      return (await res.json()) as R;
    } catch (err) {
      if (signal?.aborted) throw err;
      console.error(`[${label}] tile ${coord.z}/${coord.x}/${coord.y} failed`, err);
      return fallback;
    }
  };
}

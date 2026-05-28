import axios from 'axios';
import { axiosInstance } from '@/lib/network/axiosInstance';
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

function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export function fetchTile<R>(opts: FetchTileOptions<R>): TileFetcher<R> {
  const { endpoint, fallback, label } = opts;
  return async (coord, timestamp, signal) => {
    try {
      const { data } = await axiosInstance.get<R>(endpoint(coord, timestamp), {
        signal,
      });
      return data;
    } catch (err) {
      if (signal?.aborted) throw err;
      if (isNotFoundError(err)) return fallback;
      console.error(`[${label}] tile ${coord.z}/${coord.x}/${coord.y} failed`, err);
      return fallback;
    }
  };
}

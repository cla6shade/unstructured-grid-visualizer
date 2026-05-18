import axios from 'axios';
import { axiosInstance } from '@/lib/network/axiosInstance';

export type ConnectivityFetcher<R> = (
  z: number,
  signal?: AbortSignal,
) => Promise<R>;

export interface FetchConnectivityOptions<R> {
  endpoint: (z: number) => string;
  fallback: R;
  label: string;
}

function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

/**
 * zoom 단위로 연결성(삼각망) 데이터를 받아온다. 시간과 무관하다.
 */
export function fetchConnectivity<R>(
  opts: FetchConnectivityOptions<R>,
): ConnectivityFetcher<R> {
  const { endpoint, fallback, label } = opts;
  return async (z, signal) => {
    try {
      const { data } = await axiosInstance.get<R>(endpoint(z), { signal });
      return data;
    } catch (err) {
      if (signal?.aborted) throw err;
      if (isNotFoundError(err)) return fallback;
      console.error(`[${label}] zoom ${z} failed`, err);
      return fallback;
    }
  };
}

import { fetchTile } from '@/lib/network/fetchTile';
import type { CurrentTileData } from '../types';

// NOTE: 타일 엔드포인트의 timeIndex 위치는 백엔드 API 확정 후 조정 필요.
const fetchCurrentTile = fetchTile<CurrentTileData>({
  endpoint: ({ z, x, y }) => `/api/uv/${z}/${x}/${y}`,
  fallback: { z: 0, x: 0, y: 0, time_index: 0, points: [], triangles: [] },
  label: 'current',
});

/** current 타일은 점 데이터와 삼각망을 함께 담으므로 별도 connectivity fetch가 없다. */
export const currentFetcher = {
  fetchTile: fetchCurrentTile,
};

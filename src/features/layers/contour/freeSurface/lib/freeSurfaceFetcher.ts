import { fetchTile } from '@/lib/network/fetchTile';
import { fetchConnectivity } from '@/lib/network/fetchConnectivity';
import { oceanColorMap } from '@/lib/colorMap';
import type { ContourTileFetcher, Triangle } from '../../types';
import type { FreeSurfaceTileData } from '../types';

const H_MIN = 0;
const H_MAX = 6;

// NOTE: 타일 엔드포인트의 timestamp 위치는 백엔드 API 확정 후 조정 필요.
const fetchFreeSurfaceTile = fetchTile<FreeSurfaceTileData>({
  endpoint: ({ z, x, y }, _timestamp) =>
    // `/api/ssh/${encodeURIComponent(_timestamp ?? '')}/${z}/${x}/${y}`,
    `/api/${z}/${x}/${y}`,
  fallback: { z: 0, x: 0, y: 0, time_index: 0, points: [] },
  label: 'free-surface',
});

const fetchFreeSurfaceConnectivity = fetchConnectivity<{ triangles: Triangle[] }>({
  endpoint: (z) => `/api/conns/${z}`,
  fallback: { triangles: [] },
  label: 'free-surface-connectivity',
});

export const freeSurfaceFetcher: ContourTileFetcher = {
  async fetchTile(coord, timestamp, signal) {
    const data = await fetchFreeSurfaceTile(coord, timestamp, signal);
    return data.points.map((p) => ({
      idx: p.idx,
      lat: p.lat,
      lon: p.lon,
      color: oceanColorMap(p.h, H_MIN, H_MAX),
    }));
  },
  async fetchConnectivity(z, signal) {
    const data = await fetchFreeSurfaceConnectivity(z, signal);
    return data.triangles;
  },
};

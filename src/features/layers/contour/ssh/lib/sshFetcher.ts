import { fetchTile } from '@/lib/network/fetchTile';
import { fetchConnectivity } from '@/lib/network/fetchConnectivity';
import { oceanColorMap } from '@/lib/colorMap';
import type { ContourTileFetcher, Triangle } from '../../types';
import type { SshTileData } from '../types';

const H_MIN = 0;
const H_MAX = 6;

// NOTE: 타일 엔드포인트의 timeIndex 위치는 백엔드 API 확정 후 조정 필요.
const fetchSshTile = fetchTile<SshTileData>({
  endpoint: ({ z, x, y }, _) =>
    // `/api/ssh/${timeIndex ?? 0}/${z}/${x}/${y}`,
    `/api/${z}/${x}/${y}`,
  fallback: { z: 0, x: 0, y: 0, time_index: 0, points: [] },
  label: 'ssh',
});

const fetchSshConnectivity = fetchConnectivity<{ triangles: Triangle[] }>({
  endpoint: (z) => `/api/conns/${z}`,
  fallback: { triangles: [] },
  label: 'ssh-connectivity',
});

export const sshFetcher: ContourTileFetcher = {
  async fetchTile(coord, timeIndex, signal) {
    const data = await fetchSshTile(coord, timeIndex, signal);
    return data.points.map((p) => ({
      idx: p.idx,
      lat: p.lat,
      lon: p.lon,
      color: oceanColorMap(p.h, H_MIN, H_MAX),
    }));
  },
  async fetchConnectivity(z, signal) {
    const data = await fetchSshConnectivity(z, signal);
    return data.triangles;
  },
};

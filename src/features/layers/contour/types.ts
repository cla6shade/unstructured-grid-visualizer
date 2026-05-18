import type { TileCoord } from '@/lib/tile';

export type Triangle = [number, number, number];
export type RGBA = [number, number, number, number];

export interface ColoredPoint {
  idx: number;
  lat: number;
  lon: number;
  color: RGBA;
}

export interface SurfaceMesh {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

/**
 * contour 레이어가 데이터를 받아오는 방식.
 * - fetchTile: 시간(timeIndex)에 따라 달라지는 타일별 점 데이터
 * - fetchConnectivity: zoom별 삼각망 (시간과 무관)
 */
export interface ContourTileFetcher {
  fetchTile: (
    coord: TileCoord,
    timeIndex: number,
    signal?: AbortSignal,
  ) => Promise<ColoredPoint[]>;
  fetchConnectivity: (z: number, signal?: AbortSignal) => Promise<Triangle[]>;
}

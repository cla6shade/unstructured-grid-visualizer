import type { Triangle } from '@/features/types';

export interface CurrentPoint {
  idx: number;
  lat: number;
  lon: number;
  u: number;
  v: number;
}

export interface CurrentTileData {
  z: number;
  x: number;
  y: number;
  time_index: number;
  points: CurrentPoint[];
  triangles: Triangle[];
}

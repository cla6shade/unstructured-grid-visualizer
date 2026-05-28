export interface FreeSurfacePoint {
  idx: number;
  lat: number;
  lon: number;
  h: number;
  ssh: number;
}

export interface FreeSurfaceTileData {
  z: number;
  x: number;
  y: number;
  time_index: number;
  points: FreeSurfacePoint[];
}

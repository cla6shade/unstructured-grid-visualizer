export interface SshPoint {
  idx: number;
  lat: number;
  lon: number;
  h: number;
  ssh: number;
}

export interface SshTileData {
  z: number;
  x: number;
  y: number;
  time_index: number;
  points: SshPoint[];
}

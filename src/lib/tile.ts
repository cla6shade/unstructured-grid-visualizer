import type { LatLngBound } from '@/features/map/viewport/types';

export interface TileCoord {
  x: number;
  y: number;
  z: number;
}

export function getTileKey({ x, y, z }: TileCoord): string {
  return `${z}/${x}/${y}`;
}

export function lngToTileX(lng: number, z: number): number {
  const n = 2 ** z;
  return Math.floor(((lng + 180) / 360) * n);
}

export function latToTileY(lat: number, z: number): number {
  const n = 2 ** z;
  const clamped = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const rad = (clamped * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  );
}

export function getTileCoordsInBounds(
  z: number,
  bounds: LatLngBound,
  { maxTiles = 256, padding = 0 }: { maxTiles?: number; padding?: number } = {},
): TileCoord[] {
  // Tile zoom must be an integer; map zoom is continuous (e.g. 8.37).
  z = Math.floor(z);
  const max = 2 ** z - 1;
  const x0 = Math.max(0, Math.min(max, lngToTileX(bounds.sw.lng, z)));
  const x1 = Math.max(0, Math.min(max, lngToTileX(bounds.ne.lng, z)));
  // Tile Y axis is inverted relative to latitude (north = smaller y).
  const y0 = Math.max(0, Math.min(max, latToTileY(bounds.ne.lat, z)));
  const y1 = Math.max(0, Math.min(max, latToTileY(bounds.sw.lat, z)));

  const tiles: TileCoord[] = [];
  const xMin = Math.max(0, Math.min(x0, x1) - padding);
  const xMax = Math.min(max, Math.max(x0, x1) + padding);
  const yMin = Math.max(0, Math.min(y0, y1) - padding);
  const yMax = Math.min(max, Math.max(y0, y1) + padding);

  if ((xMax - xMin + 1) * (yMax - yMin + 1) > maxTiles) return tiles;

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ z, x, y });
    }
  }
  return tiles;
}

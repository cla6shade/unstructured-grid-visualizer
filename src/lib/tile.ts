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

/** 타일 x 인덱스 → 그 타일 서쪽 경계의 경도(lng). x+1이면 동쪽 경계. */
export function tileXToLng(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

/** 타일 y 인덱스 → 그 타일 북쪽 경계의 위도(lat). y+1이면 남쪽 경계. */
export function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export interface LngLatRect {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** 타일 좌표의 lng/lat 경계 사각형. */
export function tileLngLatBounds({ x, y, z }: TileCoord): LngLatRect {
  return {
    west: tileXToLng(x, z),
    east: tileXToLng(x + 1, z),
    north: tileYToLat(y, z),
    south: tileYToLat(y + 1, z),
  };
}

/** 점(lng, lat)이 사각형 중 하나라도 안에 드는지. */
export function lngLatInAnyRect(
  lng: number,
  lat: number,
  rects: readonly LngLatRect[],
): boolean {
  for (const r of rects) {
    if (lng >= r.west && lng <= r.east && lat >= r.south && lat <= r.north) {
      return true;
    }
  }
  return false;
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

/** 두 타일 목록이 같은 집합인지(좌표·순서 동일) 비교. getTileCoordsInBounds는 결정적 순서라 순서 비교로 충분. */
export function isSameTileSet(a: TileCoord[], b: TileCoord[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].x !== b[i].x || a[i].y !== b[i].y || a[i].z !== b[i].z) return false;
  }
  return true;
}

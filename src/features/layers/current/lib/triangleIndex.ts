export interface TriangleIndex {
  cellSize: number;
  west: number;
  south: number;
  east: number;
  north: number;
  cells: Map<number, Uint32Array>;
}

const CELL_KEY_STRIDE = 100000;

function cellKey(cx: number, cy: number): number {
  return cy * CELL_KEY_STRIDE + cx;
}

export function buildTriangleIndex(
  pointsData: Float32Array,
  pointsLoaded: Uint8Array,
  triangles: Uint32Array,
  west: number,
  south: number,
  east: number,
  north: number,
  cellSize: number,
): TriangleIndex {
  const triCount = triangles.length / 3;
  const tmp = new Map<number, number[]>();

  for (let t = 0; t < triCount; t++) {
    const i0 = triangles[t * 3];
    const i1 = triangles[t * 3 + 1];
    const i2 = triangles[t * 3 + 2];

    if (!pointsLoaded[i0] || !pointsLoaded[i1] || !pointsLoaded[i2]) continue;

    const lat0 = pointsData[i0 * 4];
    const lon0 = pointsData[i0 * 4 + 1];
    const lat1 = pointsData[i1 * 4];
    const lon1 = pointsData[i1 * 4 + 1];
    const lat2 = pointsData[i2 * 4];
    const lon2 = pointsData[i2 * 4 + 1];

    const minLon = Math.min(lon0, lon1, lon2);
    const maxLon = Math.max(lon0, lon1, lon2);
    const minLat = Math.min(lat0, lat1, lat2);
    const maxLat = Math.max(lat0, lat1, lat2);

    if (maxLon < west || minLon > east || maxLat < south || minLat > north) continue;

    const cx0 = Math.max(0, Math.floor((Math.max(minLon, west) - west) / cellSize));
    const cx1 = Math.floor((Math.min(maxLon, east) - west) / cellSize);
    const cy0 = Math.max(0, Math.floor((Math.max(minLat, south) - south) / cellSize));
    const cy1 = Math.floor((Math.min(maxLat, north) - south) / cellSize);

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const key = cellKey(cx, cy);
        let list = tmp.get(key);
        if (!list) {
          list = [];
          tmp.set(key, list);
        }
        list.push(t);
      }
    }
  }

  const cells = new Map<number, Uint32Array>();
  for (const [key, list] of tmp) {
    cells.set(key, Uint32Array.from(list));
  }

  return { cellSize, west, south, east, north, cells };
}

export interface TriangleHit {
  triIdx: number;
  w0: number;
  w1: number;
  w2: number;
}

export function queryTriangle(
  index: TriangleIndex,
  pointsData: Float32Array,
  triangles: Uint32Array,
  lng: number,
  lat: number,
): TriangleHit | null {
  if (lng < index.west || lng > index.east || lat < index.south || lat > index.north) {
    return null;
  }

  const cx = Math.floor((lng - index.west) / index.cellSize);
  const cy = Math.floor((lat - index.south) / index.cellSize);
  const list = index.cells.get(cellKey(cx, cy));
  if (!list) return null;

  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const i0 = triangles[t * 3];
    const i1 = triangles[t * 3 + 1];
    const i2 = triangles[t * 3 + 2];

    const lat0 = pointsData[i0 * 4];
    const lon0 = pointsData[i0 * 4 + 1];
    const lat1 = pointsData[i1 * 4];
    const lon1 = pointsData[i1 * 4 + 1];
    const lat2 = pointsData[i2 * 4];
    const lon2 = pointsData[i2 * 4 + 1];

    // Barycentric coords using (lon, lat) as the 2D plane.
    const v0x = lon1 - lon0;
    const v0y = lat1 - lat0;
    const v1x = lon2 - lon0;
    const v1y = lat2 - lat0;
    const v2x = lng - lon0;
    const v2y = lat - lat0;

    const d00 = v0x * v0x + v0y * v0y;
    const d01 = v0x * v1x + v0y * v1y;
    const d11 = v1x * v1x + v1y * v1y;
    const d20 = v2x * v0x + v2y * v0y;
    const d21 = v2x * v1x + v2y * v1y;

    const denom = d00 * d11 - d01 * d01;
    if (Math.abs(denom) < 1e-18) continue;
    const invDenom = 1 / denom;

    const w1 = (d11 * d20 - d01 * d21) * invDenom;
    const w2 = (d00 * d21 - d01 * d20) * invDenom;
    const w0 = 1 - w1 - w2;

    if (w0 < 0 || w1 < 0 || w2 < 0) continue;

    return { triIdx: t, w0, w1, w2 };
  }

  return null;
}

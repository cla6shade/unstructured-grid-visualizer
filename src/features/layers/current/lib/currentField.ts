import type { CurrentTileData } from '../types';
import type { TriangleIndex } from './triangleIndex';
import { queryTriangle } from './triangleIndex';

export interface CurrentField {
  // Point pool keyed by global idx. Grows as new idx are observed.
  pointsData: Float32Array; // [lat, lon, u, v] per idx slot
  pointsLoaded: Uint8Array; // 1 if idx has been written, else 0
  capacity: number; // allocated slot count
  maxIdx: number; // highest observed idx + 1
  // Connectivity, accumulated across tiles with dedupe.
  triangles: Uint32Array; // [i0, i1, i2] × triCount
  triCount: number;
  triCapacity: number;
  triKeys: Set<number>; // dedupe key per triangle
  // Bounding box of union of loaded tiles.
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface TileWithBounds {
  tile: CurrentTileData;
  west: number;
  south: number;
  east: number;
  north: number;
}

const INITIAL_POINT_CAPACITY = 4096;
const INITIAL_TRI_CAPACITY = 8192;

export function createCurrentField(): CurrentField {
  return {
    pointsData: new Float32Array(INITIAL_POINT_CAPACITY * 4),
    pointsLoaded: new Uint8Array(INITIAL_POINT_CAPACITY),
    capacity: INITIAL_POINT_CAPACITY,
    maxIdx: 0,
    triangles: new Uint32Array(INITIAL_TRI_CAPACITY * 3),
    triCount: 0,
    triCapacity: INITIAL_TRI_CAPACITY,
    triKeys: new Set<number>(),
    west: Infinity,
    south: Infinity,
    east: -Infinity,
    north: -Infinity,
  };
}

/** 빈 필드 상수. useContourSurface의 EMPTY_SURFACE에 대응 — 참조 동일성 유지용. */
export const EMPTY_FIELD: CurrentField = createCurrentField();

function ensurePointCapacity(field: CurrentField, neededSlots: number): void {
  if (neededSlots <= field.capacity) return;
  let newCap = field.capacity;
  while (newCap < neededSlots) newCap *= 2;
  const newData = new Float32Array(newCap * 4);
  newData.set(field.pointsData);
  const newLoaded = new Uint8Array(newCap);
  newLoaded.set(field.pointsLoaded);
  field.pointsData = newData;
  field.pointsLoaded = newLoaded;
  field.capacity = newCap;
}

function ensureTriCapacity(field: CurrentField, neededTris: number): void {
  if (neededTris <= field.triCapacity) return;
  let newCap = field.triCapacity;
  while (newCap < neededTris) newCap *= 2;
  const newTris = new Uint32Array(newCap * 3);
  newTris.set(field.triangles);
  field.triangles = newTris;
  field.triCapacity = newCap;
}

// Pack a sorted triple of 21-bit ints into a single 63-bit-safe number for dedupe.
function triKey(a: number, b: number, c: number): number {
  let x = a,
    y = b,
    z = c;
  if (x > y) [x, y] = [y, x];
  if (y > z) [y, z] = [z, y];
  if (x > y) [x, y] = [y, x];
  return x * 4398046511104 + y * 2097152 + z; // 2^42 + 2^21
}

export function mergeCurrentTiles(
  field: CurrentField,
  tiles: TileWithBounds[],
): CurrentField {
  for (const { tile, west, south, east, north } of tiles) {
    const points = Array.isArray(tile.points) ? tile.points : [];
    const triangles = Array.isArray(tile.triangles) ? tile.triangles : [];

    if (west < field.west) field.west = west;
    if (south < field.south) field.south = south;
    if (east > field.east) field.east = east;
    if (north > field.north) field.north = north;

    // First pass: figure out highest idx referenced so we can grow once.
    let localMax = field.maxIdx;
    for (const p of points) {
      if (p.idx + 1 > localMax) localMax = p.idx + 1;
    }
    for (const tri of triangles) {
      if (tri[0] + 1 > localMax) localMax = tri[0] + 1;
      if (tri[1] + 1 > localMax) localMax = tri[1] + 1;
      if (tri[2] + 1 > localMax) localMax = tri[2] + 1;
    }
    ensurePointCapacity(field, localMax);
    field.maxIdx = localMax;

    for (const p of points) {
      if (p.idx < 0) continue;
      const o = p.idx * 4;
      field.pointsData[o] = p.lat;
      field.pointsData[o + 1] = p.lon;
      field.pointsData[o + 2] = p.u;
      field.pointsData[o + 3] = p.v;
      field.pointsLoaded[p.idx] = 1;
    }

    if (triangles.length > 0) {
      ensureTriCapacity(field, field.triCount + triangles.length);
      for (const tri of triangles) {
        const key = triKey(tri[0], tri[1], tri[2]);
        if (field.triKeys.has(key)) continue;
        field.triKeys.add(key);
        const o = field.triCount * 3;
        field.triangles[o] = tri[0];
        field.triangles[o + 1] = tri[1];
        field.triangles[o + 2] = tri[2];
        field.triCount++;
      }
    }
  }
  return field;
}

export function sampleCurrentField(
  field: CurrentField,
  index: TriangleIndex,
  lng: number,
  lat: number,
): { u: number; v: number; speed: number } | null {
  const hit = queryTriangle(index, field.pointsData, field.triangles, lng, lat);
  if (!hit) return null;

  const { triIdx, w0, w1, w2 } = hit;
  const i0 = field.triangles[triIdx * 3];
  const i1 = field.triangles[triIdx * 3 + 1];
  const i2 = field.triangles[triIdx * 3 + 2];

  if (
    !field.pointsLoaded[i0] ||
    !field.pointsLoaded[i1] ||
    !field.pointsLoaded[i2]
  ) {
    return null;
  }

  const u0 = field.pointsData[i0 * 4 + 2];
  const v0 = field.pointsData[i0 * 4 + 3];
  const u1 = field.pointsData[i1 * 4 + 2];
  const v1 = field.pointsData[i1 * 4 + 3];
  const u2 = field.pointsData[i2 * 4 + 2];
  const v2 = field.pointsData[i2 * 4 + 3];

  const u = w0 * u0 + w1 * u1 + w2 * u2;
  const v = w0 * v0 + w1 * v1 + w2 * v2;
  const speed = Math.sqrt(u * u + v * v);

  if (speed < 0.001) return null;

  return { u, v, speed };
}

export function tileToBounds(z: number, x: number, y: number) {
  const n = 2 ** z;
  const tileWest = (x / n) * 360 - 180;
  const tileEast = ((x + 1) / n) * 360 - 180;

  const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const tileNorth = (northRad * 180) / Math.PI;
  const tileSouth = (southRad * 180) / Math.PI;

  return { west: tileWest, south: tileSouth, east: tileEast, north: tileNorth };
}

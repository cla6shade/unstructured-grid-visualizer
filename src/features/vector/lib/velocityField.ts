import type { VectorMesh } from '../types';

/**
 * VectorMesh(노드 위치 + 삼각형 connectivity + 노드별 u,v)로부터
 * 임의 (lon, lat)의 속도를 삼각형 barycentric 보간으로 샘플링하는 속도장.
 * 삼각형 탐색을 빠르게 하려고 균일 그리드에 삼각형 bbox를 미리 빈으로 담아둔다.
 */
export interface VelocityField {
  readonly minLon: number;
  readonly minLat: number;
  readonly maxLon: number;
  readonly maxLat: number;
  /** (lon, lat)가 mesh 내부면 out=[u, v]를 채우고 true, 아니면 false. */
  sample(lon: number, lat: number, out: [number, number]): boolean;
}

const GRID_N = 64;
/** barycentric 좌표 음수 허용 오차 (삼각형 경계 부근 누락 방지). */
const EPS = 1e-6;

export function createVelocityField(mesh: VectorMesh): VelocityField | null {
  const { positions, vectors, indices } = mesh;
  const triCount = indices.length / 3;
  const nodeCount = positions.length / 3;
  if (triCount === 0 || nodeCount === 0) return null;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (let i = 0; i < nodeCount; i++) {
    const lon = positions[i * 3];
    const lat = positions[i * 3 + 1];
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;
  const cellOfX = (lon: number) =>
    clampInt(Math.floor(((lon - minLon) / lonSpan) * GRID_N), 0, GRID_N - 1);
  const cellOfY = (lat: number) =>
    clampInt(Math.floor(((lat - minLat) / latSpan) * GRID_N), 0, GRID_N - 1);

  // 각 그리드 셀에 겹치는 삼각형 인덱스 목록.
  const cells: number[][] = Array.from({ length: GRID_N * GRID_N }, () => []);
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3];
    const b = indices[t * 3 + 1];
    const c = indices[t * 3 + 2];
    const ax = positions[a * 3];
    const ay = positions[a * 3 + 1];
    const bx = positions[b * 3];
    const by = positions[b * 3 + 1];
    const cx = positions[c * 3];
    const cy = positions[c * 3 + 1];

    const gx0 = cellOfX(Math.min(ax, bx, cx));
    const gx1 = cellOfX(Math.max(ax, bx, cx));
    const gy0 = cellOfY(Math.min(ay, by, cy));
    const gy1 = cellOfY(Math.max(ay, by, cy));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        cells[gy * GRID_N + gx].push(t);
      }
    }
  }

  const sample = (lon: number, lat: number, out: [number, number]): boolean => {
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) {
      return false;
    }
    const candidates = cells[cellOfY(lat) * GRID_N + cellOfX(lon)];
    for (let k = 0; k < candidates.length; k++) {
      const t = candidates[k];
      const a = indices[t * 3];
      const b = indices[t * 3 + 1];
      const c = indices[t * 3 + 2];
      const ax = positions[a * 3];
      const ay = positions[a * 3 + 1];
      const bx = positions[b * 3];
      const by = positions[b * 3 + 1];
      const cx = positions[c * 3];
      const cy = positions[c * 3 + 1];

      const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (det === 0) continue;
      const l1 = ((by - cy) * (lon - cx) + (cx - bx) * (lat - cy)) / det;
      const l2 = ((cy - ay) * (lon - cx) + (ax - cx) * (lat - cy)) / det;
      const l3 = 1 - l1 - l2;
      if (l1 < -EPS || l2 < -EPS || l3 < -EPS) continue;

      out[0] = l1 * vectors[a * 2] + l2 * vectors[b * 2] + l3 * vectors[c * 2];
      out[1] =
        l1 * vectors[a * 2 + 1] +
        l2 * vectors[b * 2 + 1] +
        l3 * vectors[c * 2 + 1];
      return true;
    }
    return false;
  };

  return { minLon, minLat, maxLon, maxLat, sample };
}

function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

import { EMPTY_SURFACE } from './emptySurface';
import type { DerivedMesh } from '@/features/tiles/lib/deriveMesh';
import { lngLatInAnyRect, type LngLatRect } from '@/lib/tile';
import type { SurfaceMesh } from '../types';

export interface DerivedTile {
  mesh: DerivedMesh;
  colors: Float32Array;
}

/**
 * tile별로 미리 계산된 (positions, colors, conn) 파생물을 받아 GPU 버퍼로 합친다.
 * 노드는 globalNodes 첫 등장 순서로 통합 vertex 배열에 누적, 삼각형은 정렬된 vertex
 * triplet으로 dedup. 색상 변환과 positions/conn 추출은 호출자(파생 캐시)에서 끝났다는 전제.
 *
 * exclude가 주어지면 centroid(lng/lat)가 그 사각형 안에 드는 삼각형을 버린다 — 더 높은
 * 해상도(z=11) 타일이 덮는 영역에서 이 베이스(z=6) 메시에 구멍을 뚫는 용도. 빈 배열이면
 * 기존과 동일하게 동작한다.
 */
export function mergeSurface(
  tiles: readonly DerivedTile[],
  exclude: readonly LngLatRect[] = [],
): SurfaceMesh {
  if (tiles.length === 0) return EMPTY_SURFACE;

  let maxGlobal = 0;
  let totalNodes = 0;
  let totalConn = 0;
  for (const { mesh } of tiles) {
    totalNodes += mesh.nodeCount;
    totalConn += mesh.conn.length;
    const { globalNodes, conn } = mesh;
    for (let i = 0; i < globalNodes.length; i++) {
      const g = globalNodes[i];
      if (g > maxGlobal) maxGlobal = g;
    }
    for (let i = 0; i < conn.length; i++) {
      const g = conn[i];
      if (g > maxGlobal) maxGlobal = g;
    }
  }

  const globalToVertex = new Int32Array(maxGlobal + 1).fill(-1);
  const positionsBuf = new Float32Array(totalNodes * 3);
  const colorsBuf = new Float32Array(totalNodes * 4);

  let vCount = 0;
  for (const { mesh, colors } of tiles) {
    const { nodeCount, globalNodes, positions } = mesh;
    for (let i = 0; i < nodeCount; i++) {
      const g = globalNodes[i];
      if (globalToVertex[g] !== -1) continue;
      globalToVertex[g] = vCount;
      positionsBuf[vCount * 3] = positions[i * 3];
      positionsBuf[vCount * 3 + 1] = positions[i * 3 + 1];
      colorsBuf[vCount * 4] = colors[i * 4];
      colorsBuf[vCount * 4 + 1] = colors[i * 4 + 1];
      colorsBuf[vCount * 4 + 2] = colors[i * 4 + 2];
      colorsBuf[vCount * 4 + 3] = colors[i * 4 + 3];
      vCount++;
    }
  }

  const indicesTmp = new Uint32Array(totalConn);
  const seen = new Map<number, Map<number, Set<number>>>();
  let written = 0;
  for (const { mesh } of tiles) {
    const conn = mesh.conn;
    const triCount = conn.length / 3;
    for (let t = 0; t < triCount; t++) {
      const a = globalToVertex[conn[t * 3]];
      const b = globalToVertex[conn[t * 3 + 1]];
      const c = globalToVertex[conn[t * 3 + 2]];
      if (a === -1 || b === -1 || c === -1) continue;
      if (exclude.length) {
        const cx = (positionsBuf[a * 3] + positionsBuf[b * 3] + positionsBuf[c * 3]) / 3;
        const cy =
          (positionsBuf[a * 3 + 1] + positionsBuf[b * 3 + 1] + positionsBuf[c * 3 + 1]) / 3;
        if (lngLatInAnyRect(cx, cy, exclude)) continue;
      }
      if (isDuplicate(seen, a, b, c)) continue;
      indicesTmp[written++] = a;
      indicesTmp[written++] = b;
      indicesTmp[written++] = c;
    }
  }

  return {
    positions: positionsBuf.slice(0, vCount * 3),
    colors: colorsBuf.slice(0, vCount * 4),
    indices: indicesTmp.slice(0, written),
  };
}

function isDuplicate(
  seen: Map<number, Map<number, Set<number>>>,
  a: number,
  b: number,
  c: number,
): boolean {
  const ab0 = a < b ? a : b;
  const ab1 = a < b ? b : a;
  const lo = ab0 < c ? ab0 : c;
  const hi = ab1 > c ? ab1 : c;
  const mid = a + b + c - lo - hi;

  let m1 = seen.get(lo);
  if (!m1) {
    m1 = new Map();
    seen.set(lo, m1);
  }
  let s = m1.get(mid);
  if (!s) {
    s = new Set();
    m1.set(mid, s);
  }
  if (s.has(hi)) return true;
  s.add(hi);
  return false;
}

import { EMPTY_VECTOR_MESH } from './emptyVectorMesh';
import type { DerivedMesh } from '@/features/tiles/lib/deriveMesh';
import type { VectorMesh } from '../types';

export interface DerivedVectorTile {
  mesh: DerivedMesh;
  /** length = mesh.nodeCount * 2, [u, v] interleave. mesh 노드와 인덱스 1:1. */
  vectors: Float32Array;
}

/**
 * tile별로 미리 계산된 (positions, vectors, conn) 파생물을 받아 하나의 VectorMesh로 합친다.
 * contour의 mergeSurface와 동일한 통합/삼각형 dedup 전략을 쓰되, 노드 attribute가
 * RGBA(4채널)가 아니라 (u, v)(2채널)인 점만 다르다. indices는 추후 barycentric 보간을 위해 보존.
 */
export function mergeVectorSurface(
  tiles: readonly DerivedVectorTile[],
): VectorMesh {
  if (tiles.length === 0) return EMPTY_VECTOR_MESH;

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
  const vectorsBuf = new Float32Array(totalNodes * 2);

  let vCount = 0;
  for (const { mesh, vectors } of tiles) {
    const { nodeCount, globalNodes, positions } = mesh;
    for (let i = 0; i < nodeCount; i++) {
      const g = globalNodes[i];
      if (globalToVertex[g] !== -1) continue;
      globalToVertex[g] = vCount;
      positionsBuf[vCount * 3] = positions[i * 3];
      positionsBuf[vCount * 3 + 1] = positions[i * 3 + 1];
      vectorsBuf[vCount * 2] = vectors[i * 2];
      vectorsBuf[vCount * 2 + 1] = vectors[i * 2 + 1];
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
      if (isDuplicate(seen, a, b, c)) continue;
      indicesTmp[written++] = a;
      indicesTmp[written++] = b;
      indicesTmp[written++] = c;
    }
  }

  return {
    positions: positionsBuf.slice(0, vCount * 3),
    vectors: vectorsBuf.slice(0, vCount * 2),
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

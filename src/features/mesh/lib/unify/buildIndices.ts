import type { MeshValuesPair } from '../../types';

/**
 * 모든 타일의 conn을 통합 vertex 인덱스로 변환해 합친다.
 * 인접 타일이 같은 경계 삼각형을 중복으로 들고 있으므로 정렬된 (lo, mid, hi)
 * vertex 인덱스를 키로 dedupe. 통합되지 않은 노드를 참조하는 삼각형은 스킵.
 */
export function buildIndices(
  pairs: MeshValuesPair[],
  globalToVertex: Int32Array,
  totalConn: number,
): Uint32Array {
  const tmp = new Uint32Array(totalConn);
  const seen = new Map<number, Map<number, Set<number>>>();
  let written = 0;

  for (const { mesh } of pairs) {
    const triCount = mesh.conn.length / 3;
    for (let t = 0; t < triCount; t++) {
      const a = globalToVertex[mesh.conn[t * 3]];
      const b = globalToVertex[mesh.conn[t * 3 + 1]];
      const c = globalToVertex[mesh.conn[t * 3 + 2]];
      if (a === -1 || b === -1 || c === -1) continue;
      if (isDuplicate(seen, a, b, c)) continue;
      tmp[written++] = a;
      tmp[written++] = b;
      tmp[written++] = c;
    }
  }
  return tmp.slice(0, written);
}

/** 정렬된 vertex triplet을 키로 중복 여부 체크 후 등록. */
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

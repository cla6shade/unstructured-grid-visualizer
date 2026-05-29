import type { MeshValuesPair } from '../../types';

export interface TileSizes {
  /** node/conn에 등장하는 최대 글로벌 인덱스 */
  maxGlobal: number;
  /** 모든 타일의 mesh.nodeCount 합 (통합 vertex 배열 사이즈 상한) */
  totalNodes: number;
  /** 모든 타일의 conn 길이 합 (통합 indices 사이즈 상한) */
  totalConn: number;
}

/** 통합 자료구조 버퍼 사이즈 결정을 위한 한 번의 스캔. */
export function tallyTileSizes(pairs: MeshValuesPair[]): TileSizes {
  let maxGlobal = 0;
  let totalNodes = 0;
  let totalConn = 0;
  for (const { mesh } of pairs) {
    totalNodes += mesh.nodeCount;
    totalConn += mesh.conn.length;
    for (let i = 0; i < mesh.node.length; i++) {
      if (mesh.node[i] > maxGlobal) maxGlobal = mesh.node[i];
    }
    for (let i = 0; i < mesh.conn.length; i++) {
      if (mesh.conn[i] > maxGlobal) maxGlobal = mesh.conn[i];
    }
  }
  return { maxGlobal, totalNodes, totalConn };
}

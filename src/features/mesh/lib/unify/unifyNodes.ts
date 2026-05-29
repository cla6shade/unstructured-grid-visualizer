import type { MeshValuesPair } from '../../types';
import type { TileSizes } from './tileSizes';

export interface UnifiedNodes {
  positions: Float32Array;
  valuesByKey: Record<string, Float32Array>;
  /** 글로벌 노드 인덱스 → 통합 vertex 인덱스 (없으면 -1) */
  globalToVertex: Int32Array;
}

/**
 * 글로벌 노드를 처음 등장 순서로 통합 vertex 배열에 누적한다.
 * positions는 [lon, lat, 0]*vCount layout. valuesByKey는 vCount 길이로 잘려 반환.
 */
export function unifyNodes(
  pairs: MeshValuesPair[],
  valueKeys: readonly string[],
  sizes: TileSizes,
): UnifiedNodes {
  const globalToVertex = new Int32Array(sizes.maxGlobal + 1).fill(-1);
  const xs = new Float32Array(sizes.totalNodes);
  const ys = new Float32Array(sizes.totalNodes);
  const valuesBuf: Record<string, Float32Array> = {};
  for (const k of valueKeys) {
    valuesBuf[k] = new Float32Array(sizes.totalNodes);
  }

  let vCount = 0;
  for (const { mesh, values } of pairs) {
    for (let i = 0; i < mesh.nodeCount; i++) {
      const g = mesh.node[i];
      if (globalToVertex[g] !== -1) continue;
      globalToVertex[g] = vCount;
      xs[vCount] = mesh.x[i];
      ys[vCount] = mesh.y[i];
      for (const k of valueKeys) {
        valuesBuf[k][vCount] = values.values[k][i];
      }
      vCount++;
    }
  }

  const positions = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i++) {
    positions[i * 3] = xs[i];
    positions[i * 3 + 1] = ys[i];
  }
  const valuesByKey: Record<string, Float32Array> = {};
  for (const k of valueKeys) {
    valuesByKey[k] = valuesBuf[k].subarray(0, vCount);
  }

  return { positions, valuesByKey, globalToVertex };
}

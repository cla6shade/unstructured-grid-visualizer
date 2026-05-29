import type { MeshTile, ValuesTile } from '@/lib/binaryTile';
import type { ContourTileFetcher } from '../types';

/**
 * mesh 타일로부터 timestamp 무관한 파생물(positions, conn)을 추출.
 * positions는 [lon, lat, 0] interleave된 vCount=nodeCount 버퍼.
 * conn은 mesh.conn을 Uint32Array로 캐스팅 — 값은 글로벌 노드 id (기존 unify 로직 전제).
 *
 * positions/globalNodes/conn은 mesh 식별자(meshKey)별로 캐싱되어
 * timestamp/scenario 변경에는 무관하게 재사용된다.
 */
export interface DerivedMesh {
  nodeCount: number;
  positions: Float32Array;
  globalNodes: Int32Array;
  conn: Int32Array;
}

export function deriveMesh(mesh: MeshTile): DerivedMesh {
  const { nodeCount, x, y, node, conn } = mesh;
  const positions = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    positions[i * 3] = x[i];
    positions[i * 3 + 1] = y[i];
  }
  return { nodeCount, positions, globalNodes: node, conn };
}

/**
 * values 타일을 fetcher.toColors로 1회 변환해 RGBA Float32Array를 만든다.
 * 결과는 (valuesKey + 'colors') 키로 캐싱되어 동일 timestamp 동안 재계산되지 않는다.
 */
export function deriveColors(
  fetcher: ContourTileFetcher,
  values: ValuesTile,
): Float32Array {
  return fetcher.toColors(values.values);
}

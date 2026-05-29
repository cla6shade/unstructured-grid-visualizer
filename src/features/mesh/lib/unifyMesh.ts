import type { MeshValuesPair, UnifiedMesh } from '../types';
import { tallyTileSizes } from './unify/tileSizes';
import { unifyNodes } from './unify/unifyNodes';
import { buildIndices } from './unify/buildIndices';

/**
 * 디코딩된 mesh+values 타일 쌍을 받아 GPU에 올릴 통합 메시 버퍼를 만든다.
 * 순수 함수 — fetch/캐시/사이드이펙트 없음. 색상 변환은 호출자 책임.
 *
 * MeshTile.conn은 글로벌 노드 인덱스를 담고, 타일 경계를 가로지르는 삼각형은
 * 이웃 타일의 노드도 참조한다. 따라서 viewport 내 모든 타일의 mesh.node를
 * 합쳐 글로벌→통합 vertex 인덱스 맵을 만들고, 그 기준으로 conn을 다시 인덱싱한다.
 */
export function unifyMesh(
  pairs: MeshValuesPair[],
  valueKeys: readonly string[],
): UnifiedMesh {
  const sizes = tallyTileSizes(pairs);
  const { positions, valuesByKey, globalToVertex } = unifyNodes(
    pairs,
    valueKeys,
    sizes,
  );
  const indices = buildIndices(pairs, globalToVertex, sizes.totalConn);
  return { positions, indices, valuesByKey };
}

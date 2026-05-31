import type { ValuesTile } from '@/lib/binaryTile';
import type { TileSource } from '@/features/tiles/types';

/**
 * GPU/CPU에 올릴 벡터장 mesh 버퍼. contour의 SurfaceMesh와 형제 격으로,
 * 색상 대신 노드별 (u, v)를 들고 있고 삼각형 connectivity(indices)를 유지한다.
 * indices를 보존하므로 추후 삼각형 내부 barycentric 보간(streamline 등)에 그대로 쓸 수 있다.
 *
 * positions = [lon, lat, 0] * vCount, vectors = [u, v] * vCount, indices = tri list.
 */
export interface VectorMesh {
  positions: Float32Array;
  vectors: Float32Array;
  indices: Uint32Array;
}

/**
 * binary tile 기반 벡터 레이어(current 등)가 데이터를 받아오는 방식.
 * 공통 TileSource(URL/캐시 키)에 노드별 (u, v) 변환(toVectors)만 더한다.
 * mesh 부분이 contour와 동일 모양이라 useDerivedMeshTiles를 그대로 공유한다.
 */
export interface VectorTileFetcher extends TileSource {
  /** nodeCount 길이의 값 배열들로부터 length = nodeCount * 2 의 [u, v] interleave 버퍼를 만든다. */
  toVectors: (values: ValuesTile['values']) => Float32Array;
}

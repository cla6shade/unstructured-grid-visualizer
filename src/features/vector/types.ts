import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';
import type { FetcherCtx } from '@/features/contour/types';

export type { FetcherCtx };

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
 * mesh URL/캐시 키 부분은 ContourTileFetcher와 동일한 모양이라 useDerivedMeshTiles를 공유한다.
 * 색상 변환(toColors) 대신 노드별 (u, v)를 만드는 toVectors를 둔다.
 */
export interface VectorTileFetcher {
  valueKeys: readonly string[];
  meshUrl: (coord: TileCoord) => string;
  meshKey: (coord: TileCoord) => readonly unknown[];
  valuesUrl: (coord: TileCoord, ctx: FetcherCtx) => string;
  valuesKey: (coord: TileCoord, ctx: FetcherCtx) => readonly unknown[];
  /** nodeCount 길이의 값 배열들로부터 length = nodeCount * 2 의 [u, v] interleave 버퍼를 만든다. */
  toVectors: (values: ValuesTile['values']) => Float32Array;
}

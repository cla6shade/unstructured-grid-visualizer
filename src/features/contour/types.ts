import type { ValuesTile } from '@/lib/binaryTile';
import type { TileSource } from '@/features/tiles/types';

/** GPU에 그대로 올라갈 색상 입힌 mesh 버퍼. positions=[x,y,0]*v, colors=rgba*v, indices=tri list. */
export interface SurfaceMesh {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

/**
 * binary tile 기반 contour 레이어가 데이터를 받아오는 방식.
 * 공통 TileSource(URL/캐시 키)에 노드별 색상 변환(toColors)만 더한다.
 */
export interface ContourTileFetcher extends TileSource {
  /**
   * 노드별 색(RGBA) 버퍼를 만든다. boundaryMask[i]=1인(육지) 노드 중 값이 0인 노드는
   * alpha 0으로 빼서 렌더링되지 않게 한다.
   */
  toColors: (
    values: ValuesTile['values'],
    boundaryMask: Uint8Array,
  ) => Float32Array;
}

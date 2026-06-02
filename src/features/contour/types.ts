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
  toColors: (values: ValuesTile['values']) => Float32Array;
}

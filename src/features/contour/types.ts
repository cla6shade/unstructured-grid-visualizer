import type { TileCoord } from '@/lib/tile';
import type { ValuesTile } from '@/lib/binaryTile';

/** GPU에 그대로 올라갈 색상 입힌 mesh 버퍼. positions=[x,y,0]*v, colors=rgba*v, indices=tri list. */
export interface SurfaceMesh {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

export interface FetcherCtx {
  typhoonId: string;
  scenarioId: string;
  timestamp: string;
}

/**
 * binary tile 기반 contour 레이어가 데이터를 받아오는 방식.
 * URL 빌더 / 캐시 키 빌더 / 디코딩 키 / 색상 변환을 한 자리에 모은다.
 */
export interface ContourTileFetcher {
  valueKeys: readonly string[];
  meshUrl: (coord: TileCoord) => string;
  meshKey: (coord: TileCoord) => readonly unknown[];
  valuesUrl: (coord: TileCoord, ctx: FetcherCtx) => string;
  valuesKey: (coord: TileCoord, ctx: FetcherCtx) => readonly unknown[];
  toColors: (values: ValuesTile['values']) => Float32Array;
}

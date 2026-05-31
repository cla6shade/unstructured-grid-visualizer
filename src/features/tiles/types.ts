import type { TileCoord } from '@/lib/tile';

/**
 * 타일 페치의 location/timestamp 컨텍스트. values URL/캐시 키를 만들 때 쓰인다.
 * scenario 상태({ typhoonId, scenarioId, timestamp })와 1:1.
 */
export interface FetcherCtx {
  typhoonId: string;
  scenarioId: string;
  timestamp: string;
}

/**
 * binary tile을 "어디서·어떻게 받아 캐싱하나"의 공통 계약.
 * contour/vector fetcher가 공유하는 부분으로, 렌더링 의견(색/벡터 변환)은 포함하지 않는다.
 * 각 피처의 fetcher는 이를 extends 하고 변환 함수(toColors/toVectors)만 추가한다.
 */
export interface TileSource {
  valueKeys: readonly string[];
  meshUrl: (coord: TileCoord) => string;
  meshKey: (coord: TileCoord) => readonly unknown[];
  valuesUrl: (coord: TileCoord, ctx: FetcherCtx) => string;
  valuesKey: (coord: TileCoord, ctx: FetcherCtx) => readonly unknown[];
}

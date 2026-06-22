import type { TileCoord } from '@/lib/tile';

/**
 * 타일 페치의 location/scenario 컨텍스트. mesh/values URL·캐시 키를 만들 때 쓰인다.
 * scenario 상태({ typhoonId, scenarioId, timestamp }) + 현재 location(셀렉터)로 구성된다.
 * mesh 키는 location만 참조하고 timestamp/scenario에는 무관해 캐시가 분리된다.
 */
export interface FetcherCtx {
  typhoonId: string;
  scenarioId: string;
  timestamp: string;
  /** 타일 URL의 location 경로 세그먼트 (korea/busan/...). locationStore에서 주입. */
  location: string;
}

/**
 * binary tile을 "어디서·어떻게 받아 캐싱하나"의 공통 계약.
 * contour/vector fetcher가 공유하는 부분으로, 렌더링 의견(색/벡터 변환)은 포함하지 않는다.
 * 각 피처의 fetcher는 이를 extends 하고 변환 함수(toColors/toVectors)만 추가한다.
 *
 * mesh URL/키도 location을 포함하므로 ctx를 받는다. 단 mesh는 ctx.location만 쓰고
 * timestamp/scenario는 무시해 geometry 캐시의 timestamp-독립성을 유지한다.
 */
export interface TileSource {
  valueKeys: readonly string[];
  meshUrl: (coord: TileCoord, ctx: FetcherCtx) => string;
  meshKey: (coord: TileCoord, ctx: FetcherCtx) => readonly unknown[];
  valuesUrl: (coord: TileCoord, ctx: FetcherCtx) => string;
  valuesKey: (coord: TileCoord, ctx: FetcherCtx) => readonly unknown[];
}

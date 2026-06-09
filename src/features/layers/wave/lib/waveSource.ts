import { LAYER_VALUE_KEYS } from '@/lib/binaryTile';
import type { TileSource } from '@/features/tiles/types';

const LAYER = 'wave';

/**
 * Wave 레이어의 공통 TileSource. WH(파고) contour와 THETAW(파향) flow가
 * 같은 mesh/values 타일을 가리키므로(둘 다 valueKeys=['WH','THETAW']) URL/캐시 키를
 * 한 곳에 두고 두 fetcher가 spread로 재사용한다. 변환(toColors/toVectors)만 각자 덧붙인다.
 */
export const waveSource: TileSource = {
  valueKeys: LAYER_VALUE_KEYS.wave.wave,
  meshUrl: ({ x, y }, { location }) => `/api/subset/mesh/${location}/${x}/${y}`,
  meshKey: ({ x, y }, { location }) => [location, 'mesh', x, y],
  valuesUrl: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    `/api/subset/${typhoonId}/${location}/${scenarioId}/${LAYER}/${timestamp}/${x}/${y}`,
  valuesKey: ({ x, y }, { typhoonId, scenarioId, timestamp, location }) =>
    [location, scenarioId, LAYER, typhoonId, timestamp, x, y],
};

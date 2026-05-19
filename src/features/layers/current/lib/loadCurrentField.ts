import type { TileCoord } from '@/lib/tile';
import {
  EMPTY_FIELD,
  createCurrentField,
  mergeCurrentTiles,
  tileToBounds,
} from './currentField';
import type { CurrentField, TileWithBounds } from './currentField';
import { currentFetcher } from './currentFetcher';

/**
 * 주어진 타일들에 대해 current 필드를 만든다.
 * 캐싱은 브라우저 HTTP 캐시에 위임한다(메모리 캐시 없음).
 * 실패하거나 abort되면 EMPTY_FIELD를 반환한다(useContourSurface의 EMPTY_SURFACE와 동일).
 */
export async function loadCurrentField(
  tiles: TileCoord[],
  timeIndex: number,
  signal?: AbortSignal,
): Promise<CurrentField> {
  try {
    const results = await Promise.all(
      tiles.map(async (coord) => {
        const tile = await currentFetcher.fetchTile(coord, timeIndex, signal);
        return {
          tile,
          ...tileToBounds(coord.z, coord.x, coord.y),
        } satisfies TileWithBounds;
      }),
    );

    if (signal?.aborted) return EMPTY_FIELD;

    const field = createCurrentField();
    mergeCurrentTiles(field, results);
    return field;
  } catch (err) {
    if (!signal?.aborted) {
      console.error('[current] field load failed', err);
    }
    return EMPTY_FIELD;
  }
}

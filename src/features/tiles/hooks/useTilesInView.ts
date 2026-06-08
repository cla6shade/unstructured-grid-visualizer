import { useMemo, useRef } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { getTileCoordsInBounds, isSameTileSet, type TileCoord } from '@/lib/tile';

/**
 * 현재 viewport(zoom/bounds) 안에 보이는 z 타일 좌표를 계산한다.
 * z는 호출부가 결정한다(예: contour/vector는 6, 향후 다른 레이어는 11 등).
 *
 * @param z        타일 줌 레벨.
 * @param minZoom  이 줌 미만이면 빈 배열(타일 미표시). 기본값 z — "z 타일은 zoom ≥ z에서만".
 * @param padding  화면 밖으로 확장할 타일 링 두께. 기본 1.
 * @param enabled  false면 viewport와 무관하게 빈 배열(타일 fetch 중지). 기본 true.
 */
export function useTilesInView(
  z: number,
  {
    enabled = true,
    padding = 1,
    minZoom = z,
  }: { enabled?: boolean; padding?: number; minZoom?: number } = {},
): TileCoord[] {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);
  // 직전 결과를 들고 있다가, 타일 집합이 그대로면 같은 배열 레퍼런스를 반환한다.
  // 단순 팬/줌으로 보이는 타일이 안 바뀌면 하위 메모(mergeSurface, 속도장 재생성)가
  // 무효화되지 않아 흐름 애니메이션이 끊기지 않는다.
  const prevRef = useRef<TileCoord[]>([]);
  return useMemo(() => {
    const next =
      !enabled || zoom < minZoom
        ? []
        : getTileCoordsInBounds(z, bounds, { padding });
    if (isSameTileSet(prevRef.current, next)) return prevRef.current;
    prevRef.current = next;
    return next;
  }, [z, enabled, minZoom, padding, zoom, bounds]);
}

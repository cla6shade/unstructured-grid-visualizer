import type { TileCoord } from '@/lib/tile';
import { PORT_ZOOM } from '@/features/map/locationSelector/constants/locations';

/**
 * 항구별 z=11 디테일 타일 좌표. repo 루트 `tiles_by_port.json`의
 * `<port>.models.surge["11"].tiles`([x, y] 목록)를 그대로 옮겨 적은 것.
 * (surge/wave 타일 목록이 동일하고 현재 레이어가 surge 필드이므로 surge 사용.)
 * 디테일 타일은 viewport가 아니라 이 고정 목록을 참조한다.
 */
const PORT_Z11_TILES: Record<string, [number, number][]> = {
  busan: [
    [1757, 810],
    [1757, 811],
    [1758, 810],
    [1758, 811],
    [1759, 810],
  ],
  donghae: [
    [1758, 792],
    [1758, 793],
    [1758, 794],
    [1759, 792],
    [1759, 793],
    [1759, 794],
    [1760, 793],
  ],
  jeju: [
    [1742, 823],
    [1742, 824],
    [1743, 823],
    [1743, 824],
    [1744, 823],
    [1744, 824],
  ],
  jinhae: [
    [1754, 810],
    [1754, 811],
    [1754, 812],
    [1755, 809],
    [1755, 810],
    [1755, 811],
    [1756, 810],
    [1756, 811],
    [1756, 812],
    [1757, 810],
    [1757, 811],
  ],
  mokpo: [
    [1741, 812],
    [1741, 813],
    [1742, 811],
    [1742, 812],
    [1742, 813],
    [1743, 811],
    [1743, 812],
    [1743, 813],
  ],
};

/** urlKey(항구 location)의 z=11 디테일 타일 좌표. 없으면 빈 배열. */
export function portDetailTiles(urlKey: string): TileCoord[] {
  return (PORT_Z11_TILES[urlKey] ?? []).map(([x, y]) => ({
    x,
    y,
    z: PORT_ZOOM,
  }));
}

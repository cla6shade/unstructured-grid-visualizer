import type { LocationId } from '@/features/map/locationSelector/constants/locations';

/**
 * 앱 location(LocationId) → catalog region_key 목록.
 * 대부분 1:1이지만 busan만 catalog에서 busan1(부산항)·busan2 두 region으로 갈린다.
 */
export const LOCATION_REGION_KEYS: Record<LocationId, string[]> = {
  korea: ['korea'],
  jinhae: ['jinhae'],
  busan: ['busan1', 'busan2'],
  donghae: ['donghae'],
  jeju: ['jeju'],
  mokpo: ['mokpo'],
};

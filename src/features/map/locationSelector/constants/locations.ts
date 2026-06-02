import { INITIAL_CENTER, MAP_DEFAULT_ZOOM } from '@/features/map/constants/mapConfig';

export type LocationId =
  | 'korea'
  | 'jinhae'
  | 'busan'
  | 'donghae'
  | 'jeju'
  | 'mokpo';

export interface LocationDef {
  id: LocationId;
  /** 버튼 라벨 (전국/진해/부산/...) */
  label: string;
  /** 타일 URL의 location 경로 세그먼트 (korea/busan/...) */
  urlKey: string;
  lat: number;
  lng: number;
}

export const KOREA_LOCATION_ID: LocationId = 'korea';

/** 전국 = MAP_DEFAULT_ZOOM(6), 항구 = 11 */
export const KOREA_ZOOM = MAP_DEFAULT_ZOOM;
export const PORT_ZOOM = 11;

/** 전국 + 항구 목록. 좌표는 구 koos-front의 locations.ts에서 가져옴. */
export const LOCATIONS: LocationDef[] = [
  {
    id: 'korea',
    label: '전국',
    urlKey: 'korea',
    lat: INITIAL_CENTER.lat,
    lng: INITIAL_CENTER.lng,
  },
  { id: 'jinhae', label: '진해', urlKey: 'jinhae', lat: 35.1335, lng: 128.6811 },
  { id: 'busan', label: '부산', urlKey: 'busan', lat: 35.1028, lng: 129.0403 },
  { id: 'donghae', label: '동해', urlKey: 'donghae', lat: 37.5, lng: 129.15 },
  {
    id: 'jeju',
    label: '강정',
    urlKey: 'jeju',
    lat: 33.2468,
    lng: 126.417,
  },
  { id: 'mokpo', label: '목포', urlKey: 'mokpo', lat: 34.7888, lng: 126.3881 },
];

export const KOREA_LOCATION: LocationDef = LOCATIONS[0];

/** 항구만(전국 제외) — 셀렉터의 원형 버튼 목록. */
export const PORTS: LocationDef[] = LOCATIONS.filter(
  (l) => l.id !== KOREA_LOCATION_ID,
);

export function zoomForLocation(id: LocationId): number {
  return id === KOREA_LOCATION_ID ? KOREA_ZOOM : PORT_ZOOM;
}

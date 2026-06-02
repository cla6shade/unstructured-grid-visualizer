import { INITIAL_CENTER, MAP_DEFAULT_ZOOM } from '@/features/map/constants/mapConfig';
import type { LatLng } from '@/features/map/viewport/types';
import type { LngLatRect } from '@/lib/tile';

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
  /** flyTo·감지 기준이 되는 실제 항구 좌표 */
  lat: number;
  lng: number;
  /** 지도 위 마커 표시 좌표 (생략 시 항구 좌표와 동일). 라벨이 항구를 가리지 않게 살짝 옮긴다. */
  marker?: { lat: number; lng: number };
  /**
   * 항구 영역 boundary(lng/lat 사각형). z=11 디테일 타일(portTiles)들의 합집합 bounding box를
   * **미리 계산해 박아둔 값**이다(런타임에 portTiles를 import해 동적 계산하지 않는다).
   * 뷰포트 중심이 이 사각형 안에 들면 그 항구로 판정한다. 전국(korea)은 없음.
   */
  bounds?: LngLatRect;
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
  {
    id: 'jinhae',
    label: '진해',
    urlKey: 'jinhae',
    lat: 35.1335,
    lng: 128.6811,
    marker: { lat: 35.1335, lng: 128.5211 },
    bounds: { west: 128.320313, south: 34.741612, east: 129.023438, north: 35.317366 },
  },
  {
    id: 'busan',
    label: '부산',
    urlKey: 'busan',
    lat: 35.1028,
    lng: 129.0403,
    marker: { lat: 35.1028, lng: 129.2003 },
    bounds: { west: 128.847656, south: 34.885931, east: 129.375, north: 35.173808 },
  },
  {
    id: 'donghae',
    label: '동해',
    urlKey: 'donghae',
    lat: 37.5,
    lng: 129.15,
    bounds: { west: 129.023438, south: 37.300275, east: 129.550781, north: 37.71859 },
  },
  {
    id: 'jeju',
    label: '강정',
    urlKey: 'jeju',
    lat: 33.2468,
    lng: 126.417,
    bounds: { west: 126.210938, south: 32.990236, east: 126.738281, north: 33.28462 },
  },
  {
    id: 'mokpo',
    label: '목포',
    urlKey: 'mokpo',
    lat: 34.7888,
    lng: 126.3881,
    bounds: { west: 126.035156, south: 34.597042, east: 126.5625, north: 35.029996 },
  },
];

export const KOREA_LOCATION: LocationDef = LOCATIONS[0];

/** 항구만(전국 제외) — 셀렉터의 원형 버튼 목록. */
export const PORTS: LocationDef[] = LOCATIONS.filter(
  (l) => l.id !== KOREA_LOCATION_ID,
);

export function zoomForLocation(id: LocationId): number {
  return id === KOREA_LOCATION_ID ? KOREA_ZOOM : PORT_ZOOM;
}

/** 지도 위 마커 좌표(오프셋이 있으면 그것, 없으면 항구 좌표). */
export function getMarkerCoord(loc: LocationDef): { lat: number; lng: number } {
  return loc.marker ?? { lat: loc.lat, lng: loc.lng };
}

/** 이 줌 미만이면 항구 감지 없이 전국으로 본다. */
export const REGION_DETECT_ZOOM = PORT_ZOOM;

/**
 * 현재 뷰포트(zoom + center)로 '보고 있는 지역'을 판정한다.
 * zoom이 임계값 이상일 때, 뷰포트 중심이 항구 boundary(미리 계산된 lng/lat 사각형) 안에 드는
 * 항구들 중 중심에 가장 가까운 한 곳을 고른다(부산·진해처럼 영역이 겹칠 때 대비). 없으면 전국.
 */
export function detectRegionId(zoom: number, center: LatLng): LocationId {
  if (zoom < REGION_DETECT_ZOOM) return KOREA_LOCATION_ID;
  let best: LocationId = KOREA_LOCATION_ID;
  let bestDist = Infinity;
  for (const p of PORTS) {
    const b = p.bounds;
    if (!b) continue;
    const inside =
      center.lng >= b.west &&
      center.lng <= b.east &&
      center.lat >= b.south &&
      center.lat <= b.north;
    if (!inside) continue;
    const dLat = p.lat - center.lat;
    const dLng = p.lng - center.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = p.id;
    }
  }
  return best;
}

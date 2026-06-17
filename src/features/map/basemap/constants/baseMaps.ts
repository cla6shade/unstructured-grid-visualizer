import type { StyleSpecification } from 'maplibre-gl';
import {
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  // 위성 지도(VWORLD)용. 위성 지도 복원 시 함께 주석 해제.
  // VWORLD_MAX_ZOOM,
} from '@/features/map/constants/mapConfig';
import { getTileServerUrl } from '@/lib/network/tileServer';

// 위성 지도(VWORLD) 복원 시 주석 해제.
// const VWORLD_API_KEY = import.meta.env.VITE_VWORLD_API_KEY as string;

export interface BaseMapOption {
  id: string;
  label: string;
  style: StyleSpecification;
}

// 타일 서버 주소가 런타임(설정 화면 입력)에 정해지므로, BASEMAPS는 호출 시점에 만든다.
// (모듈 로드 시점엔 아직 주소가 없을 수 있다.)
export function getBasemaps(): BaseMapOption[] {
  const tileServerUrl = getTileServerUrl();
  return [
    {
      id: 'default',
      label: '일반 지도',
      style: {
        version: 8,
        sources: {
          'koos-tiles': {
            type: 'raster',
            tiles: [`${tileServerUrl}/api/map/{z}/{x}/{y}`],
            tileSize: 256,
            minzoom: MAP_MIN_ZOOM,
            maxzoom: 12,
          },
        },
        layers: [
          {
            id: 'koos-tiles-layer',
            type: 'raster',
            source: 'koos-tiles',
            minzoom: MAP_MIN_ZOOM,
            maxzoom: MAP_MAX_ZOOM + 1,
          },
        ],
      },
    },
    // 위성 지도(VWORLD). 현재 일반 지도만 사용하므로 비활성화. 복원 시 주석 해제 + 위 VWORLD import/키도 해제.
    // {
    //   id: 'satellite',
    //   label: '위성 지도',
    //   style: {
    //     version: 8,
    //     sources: {
    //       vworld: {
    //         type: 'raster',
    //         tiles: [
    //           `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`,
    //         ],
    //         tileSize: 256,
    //       },
    //     },
    //     layers: [
    //       {
    //         id: 'vworld-layer',
    //         type: 'raster',
    //         source: 'vworld',
    //         minzoom: MAP_MIN_ZOOM,
    //         maxzoom: Math.min(MAP_MAX_ZOOM + 1, VWORLD_MAX_ZOOM),
    //       },
    //     ],
    //   },
    // },
  ];
}

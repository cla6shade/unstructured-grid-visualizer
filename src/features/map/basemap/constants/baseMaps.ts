import type { StyleSpecification } from 'maplibre-gl';
import {
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  VWORLD_MAX_ZOOM,
} from '@/features/map/constants/mapConfig';

const VWORLD_API_KEY = import.meta.env.VITE_VWORLD_API_KEY as string;
const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL as string;

export interface BaseMapOption {
  id: string;
  label: string;
  style: StyleSpecification;
}

export const BASEMAPS: BaseMapOption[] = [
  {
    id: 'default',
    label: '일반 지도',
    style: {
      version: 8,
      sources: {
        'koos-tiles': {
          type: 'raster',
          tiles: [`${TILE_SERVER_URL}/api/map/{z}/{x}/{y}`],
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
  {
    id: 'satellite',
    label: '위성 지도',
    style: {
      version: 8,
      sources: {
        vworld: {
          type: 'raster',
          tiles: [
            `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`,
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'vworld-layer',
          type: 'raster',
          source: 'vworld',
          minzoom: MAP_MIN_ZOOM,
          maxzoom: Math.min(MAP_MAX_ZOOM + 1, VWORLD_MAX_ZOOM),
        },
      ],
    },
  },
];

import type { ViewportState } from '@/features/map/viewport/types';

export const MAP_DEFAULT_ZOOM = 6;
export const MAP_MIN_ZOOM = 6;
export const MAP_MAX_ZOOM = 15;

export const VWORLD_MAX_ZOOM = 19;

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [117.0, 30.0],
  [138.0, 44.0],
];

export const INITIAL_CENTER = { lat: 35.2769, lng: 127.7717 };

export const INITIAL_VIEWPORT: ViewportState = {
  center: INITIAL_CENTER,
  zoom: MAP_DEFAULT_ZOOM,
  bounds: {
    sw: { lng: MAP_BOUNDS[0][0], lat: MAP_BOUNDS[0][1] },
    ne: { lng: MAP_BOUNDS[1][0], lat: MAP_BOUNDS[1][1] },
  },
};

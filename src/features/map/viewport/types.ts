import type { StoreApi } from 'zustand';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLngBound {
  sw: LatLng;
  ne: LatLng;
}

export interface ViewportState {
  center: LatLng;
  zoom: number;
  bounds: LatLngBound;
}

export interface ViewportStore extends ViewportState {
  _setView: (view: ViewportState) => void;
}

export type ViewportStoreInstance = StoreApi<ViewportStore>;

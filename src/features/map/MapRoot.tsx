import { useRef } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BasemapProvider } from '@/features/map/basemap/components/BasemapProvider';
import { BasemapSelector } from '@/features/map/basemap/components/BasemapSelector';
import { useBasemap } from '@/features/map/basemap/hooks/useBasemap';
import { transformRequest } from '@/features/map/lib/transformRequest';
import { ViewportProvider } from '@/features/map/viewport/components/ViewportProvider';
import { useSyncView } from '@/features/map/viewport/hooks/useSyncView';
import {
  INITIAL_CENTER,
  INITIAL_VIEWPORT,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MAP_BOUNDS,
} from '@/features/map/constants/mapConfig';

export function MapRoot() {
  return (
    <ViewportProvider initialState={INITIAL_VIEWPORT}>
      <BasemapProvider>
        <MapView />
      </BasemapProvider>
    </ViewportProvider>
  );
}

function MapView() {
  const mapRef = useRef<MapRef | null>(null);
  const basemap = useBasemap((s) => s.basemap);
  const syncView = useSyncView(mapRef);

  return (
    <div className="w-dvw h-dvh absolute top-0 left-0">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: INITIAL_CENTER.lng,
          latitude: INITIAL_CENTER.lat,
          zoom: MAP_DEFAULT_ZOOM,
        }}
        attributionControl={false}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={MAP_BOUNDS}
        mapStyle={basemap.style}
        transformRequest={transformRequest}
        onLoad={syncView}
        onMoveEnd={syncView}
        style={{ width: '100%', height: '100%' }}
      />
      <BasemapSelector />
    </div>
  );
}

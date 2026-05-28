import { Suspense, useMemo, useRef } from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BasemapProvider } from '@/features/map/basemap/components/BasemapProvider';
import { BasemapSelector } from '@/features/map/basemap/components/BasemapSelector';
import { useBasemap } from '@/features/map/basemap/hooks/useBasemap';
import { transformRequest } from '@/features/map/lib/transformRequest';
import { ViewportProvider } from '@/features/map/viewport/components/ViewportProvider';
import { useSyncView } from '@/features/map/viewport/hooks/useSyncView';
import { DeckOverlayProvider } from '@/features/map/deck/components/DeckOverlayProvider';
import { ScenarioProvider } from '@/features/map/scenario/components/ScenarioProvider';
import { fetchCatalog } from '@/features/map/scenario/lib/fetchCatalog';
import { CoastlineLayer } from '@/features/layers/coastline/components/CoastlineLayer';
import { FreeSurfaceLayer } from '@/features/layers/contour/freeSurface/components/FreeSurfaceLayer';
import {
  INITIAL_CENTER,
  INITIAL_VIEWPORT,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MAP_BOUNDS,
} from '@/features/map/constants/mapConfig';

export function MapRoot() {
  const catalogPromise = useMemo(() => fetchCatalog(), []);

  return (
    <ViewportProvider initialState={INITIAL_VIEWPORT}>
      <Suspense fallback={null}>
        <ScenarioProvider catalogPromise={catalogPromise}>
          <BasemapProvider>
            <MapView />
          </BasemapProvider>
        </ScenarioProvider>
      </Suspense>
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
      >
        <DeckOverlayProvider>
          <CoastlineLayer />
          <FreeSurfaceLayer />
        </DeckOverlayProvider>
      </Map>
      <BasemapSelector />
    </div>
  );
}

import { Suspense, useMemo, useRef } from 'react';
import { Map, AttributionControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BasemapProvider } from '@/features/map/basemap/components/BasemapProvider';
// 현재 일반 지도만 사용하므로 지도 선택기 UI는 숨김. 선택지(위성 등) 복원 시 주석 해제.
// import { BasemapSelector } from '@/features/map/basemap/components/BasemapSelector';
import { useBasemap } from '@/features/map/basemap/hooks/useBasemap';
import { transformRequest } from '@/features/auth/lib/transformRequest';
import { ViewportProvider } from '@/features/map/viewport/components/ViewportProvider';
import { useSyncView } from '@/features/map/viewport/hooks/useSyncView';
import { DeckOverlayProvider } from '@/features/map/deck/components/DeckOverlayProvider';
import { ScenarioProvider } from '@/features/map/scenario/components/ScenarioProvider';
import { ScenarioTimeSelector } from '@/features/map/scenario/components/ScenarioTimeSelector';
import { TyphoonScenarioBar } from '@/features/map/scenario/components/TyphoonScenarioBar';
import { TyphoonSidebar } from '@/features/map/scenario/components/TyphoonSidebar';
import { LayerSelector } from '@/features/map/layerSelector/components/LayerSelector';
import { LocationSelector } from '@/features/map/locationSelector/components/LocationSelector';
import { LocationPinLayer } from '@/features/map/locationSelector/components/LocationPinLayer';
import { useFlyToLocation } from '@/features/map/locationSelector/hooks/useFlyToLocation';
import { useSyncLocationFromViewport } from '@/features/map/locationSelector/hooks/useSyncLocationFromViewport';
import { TimeseriesStationLayer } from '@/features/timeseries/components/TimeseriesStationLayer';
import { TimeseriesChartModal } from '@/features/timeseries/components/TimeseriesChartModal';
import { DensityControl } from '@/features/map/density/components/DensityControl';
import { LayerColorBars } from '@/features/layers/shared/components/LayerColorBars';
import { fetchCatalog } from '@/features/map/scenario/lib/fetchCatalog';
import { LoadingStatusProvider } from '@/features/map/loading/components/LoadingStatusProvider';
import { InitialLoadingScreen } from '@/features/map/loading/components/InitialLoadingScreen';
import { CATALOG_ROW } from '@/features/map/loading/components/loadingRows';
import { LoadingOverlay } from '@/features/map/loading/components/LoadingOverlay';
import { MapLayers } from '@/features/layers/shared/components/MapLayers';
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
      <LoadingStatusProvider>
        <Suspense
          fallback={
            <InitialLoadingScreen rows={[{ ...CATALOG_ROW, loaded: false }]} />
          }
        >
          <ScenarioProvider catalogPromise={catalogPromise}>
            <BasemapProvider>
              <MapView />
            </BasemapProvider>
          </ScenarioProvider>
        </Suspense>
      </LoadingStatusProvider>
    </ViewportProvider>
  );
}

function MapView() {
  const mapRef = useRef<MapRef | null>(null);
  const basemap = useBasemap((s) => s.basemap);
  const syncView = useSyncView(mapRef);
  const goToLocation = useFlyToLocation(mapRef);
  // 뷰포트(팬/줌·클릭 jumpTo) → 현재 location 파생.
  useSyncLocationFromViewport();

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
        <AttributionControl compact position="bottom-left" />
        <DeckOverlayProvider>
          <MapLayers />
        </DeckOverlayProvider>
        <LocationPinLayer onSelect={goToLocation} />
        <TimeseriesStationLayer />
      </Map>
      {/* 지도 선택기 숨김(현재 일반 지도만 사용). 복원 시 위 import와 함께 주석 해제. */}
      {/* <BasemapSelector /> */}
      <div className="absolute top-10 left-10 z-[1000] flex flex-col gap-4">
        <TyphoonScenarioBar />
        <LocationSelector onSelect={goToLocation} />
      </div>
      <TyphoonSidebar />
      <LayerSelector />
      <ScenarioTimeSelector />
      <LoadingOverlay />
      <TimeseriesChartModal />
      <div className="absolute bottom-[16px] right-10 z-[1000] flex flex-col items-end gap-2">
        <DensityControl />
        <LayerColorBars />
      </div>
    </div>
  );
}

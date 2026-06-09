import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import {
  KOREA_LOCATION_ID,
  PORT_ZOOM,
} from '@/features/map/locationSelector/constants/locations';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { fetchBoundary } from '../lib/fetchBoundary';

export interface BoundaryMask {
  /** 현재 항구의 boundary GeoJSON. 전국 뷰이거나 아직 로드 전이면 null. */
  geojson: GeoJSON.FeatureCollection | null;
  /** boundary가 도착해 마스크를 적용할 수 있는지. */
  isLoaded: boolean;
}

/**
 * 현재 location이 항구이고 zoom이 PORT_ZOOM(11) 이상일 때만
 * `/api/subset/boundary/{urlKey}`를 받아온다. z < 11에서는 마스크를 완전히 비활성화한다
 * (geojson=null → LocalMaskLayer 미등록, isLoaded=false → 레이어 maskId 미부여).
 * boundary는 URL-불변이라 staleTime: Infinity. react-query가 key로 dedupe하므로
 * 여러 레이어 컴포넌트가 동시에 호출해도 단일 요청만 나간다.
 */
export function useBoundaryMask(): BoundaryMask {
  const location = useLocationStore((s) => s.location);
  const isPort = location.id !== KOREA_LOCATION_ID;
  // 임계값(11)을 넘나들 때만 re-render되도록 selector에서 boolean으로 뽑는다.
  const atPortZoom = useViewport((s) => s.zoom >= PORT_ZOOM);
  const active = isPort && atPortZoom;

  const { data } = useQuery({
    queryKey: ['boundary', location.urlKey],
    queryFn: () => fetchBoundary(location.urlKey),
    enabled: active,
    staleTime: Infinity,
  });

  const geojson = active ? (data ?? null) : null;
  const isLoaded = geojson != null && geojson.features.length > 0;

  return { geojson, isLoaded };
}

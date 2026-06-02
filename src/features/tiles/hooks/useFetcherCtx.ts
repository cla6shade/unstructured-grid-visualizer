import { useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import type { FetcherCtx } from '../types';

/** 현재 scenario + location 상태를 타일 페치 컨텍스트(FetcherCtx)로 묶는다. */
export function useFetcherCtx(): FetcherCtx {
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  const location = useLocationStore((s) => s.location.urlKey);
  return useMemo(
    () => ({ typhoonId, scenarioId, timestamp, location }),
    [typhoonId, scenarioId, timestamp, location],
  );
}

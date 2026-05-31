import { useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import type { FetcherCtx } from '../types';

/** 현재 scenario 상태를 values 타일 페치 컨텍스트(FetcherCtx)로 묶는다. */
export function useFetcherCtx(): FetcherCtx {
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  return useMemo(
    () => ({ typhoonId, scenarioId, timestamp }),
    [typhoonId, scenarioId, timestamp],
  );
}

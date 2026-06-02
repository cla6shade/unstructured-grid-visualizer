import { useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import type { FetcherCtx } from '../types';

/**
 * 현재 scenario + location 상태를 타일 페치 컨텍스트(FetcherCtx)로 묶는다.
 * locationOverride를 주면 그 location을 사용한다(베이스=전국, 디테일=항구처럼
 * 한 컴포넌트에서 두 location 슬롯을 동시에 받을 때). 생략하면 현재 선택 location.
 */
export function useFetcherCtx(locationOverride?: string): FetcherCtx {
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  const current = useLocationStore((s) => s.location.urlKey);
  const location = locationOverride ?? current;
  return useMemo(
    () => ({ typhoonId, scenarioId, timestamp, location }),
    [typhoonId, scenarioId, timestamp, location],
  );
}

import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLoadingStatus } from '@/features/map/loading/hooks/useLoadingStatus';
import type { LayerId } from '@/features/layers/core/registry';

/**
 * 레이어가 현재 뷰포트 내용을 모두 로드했을 때(`ready`) 현재 timestamp 버킷에
 * 완료를 마킹한다. useEffect 없이 렌더 단계에서 직접 호출하며, markIsInitialLoaded는
 * 멱등 + microtask 디퍼라 반복 호출/렌더 경고에 안전하다.
 */
export function useReportInitialLoad(layerId: LayerId, ready: boolean) {
  const timestamp = useScenario((s) => s.timestamp);
  const mark = useLoadingStatus((s) => s.markIsInitialLoaded);
  if (ready) mark(layerId, timestamp);
}

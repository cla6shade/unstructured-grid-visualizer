import type { StoreApi } from 'zustand';
import type { LayerId } from '@/features/layers/core/registry';

/** timestamp별 레이어 완료 버킷. 조회는 항상 현재 scenario.timestamp 버킷을 본다. */
export type LoadedByTimestamp = Record<string, Partial<Record<LayerId, true>>>;

export interface LoadingStatusState {
  loaded: LoadedByTimestamp;
}

export interface LoadingStatusStore extends LoadingStatusState {
  /**
   * 해당 timestamp 버킷에 layerId를 완료로 추가한다(멱등).
   * 렌더 단계에서 직접 호출되므로 실제 set은 queueMicrotask로 미뤄
   * 렌더 중 다른 컴포넌트 갱신 경고를 피한다.
   */
  markIsInitialLoaded: (layerId: LayerId, timestamp: string) => void;
}

export type LoadingStatusStoreInstance = StoreApi<LoadingStatusStore>;

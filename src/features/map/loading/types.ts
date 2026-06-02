import type { StoreApi } from 'zustand';
import type { LayerId } from '@/features/layers/core/registry';

/**
 * (location, timestamp)별 레이어 완료 버킷. 조회는 항상 현재 location+timestamp
 * 버킷을 본다. location이 바뀌면 새 버킷이 비어 로딩 오버레이가 자동으로 다시 뜬다.
 */
export type LoadedByView = Record<string, Partial<Record<LayerId, true>>>;

/** location+timestamp를 로딩 버킷 키로 합친다. */
export function loadViewKey(location: string, timestamp: string): string {
  return `${location}|${timestamp}`;
}

export interface LoadingStatusState {
  loaded: LoadedByView;
}

export interface LoadingStatusStore extends LoadingStatusState {
  /**
   * 해당 (location, timestamp) 버킷에 layerId를 완료로 추가한다(멱등).
   * 렌더 단계에서 직접 호출되므로 실제 set은 queueMicrotask로 미뤄
   * 렌더 중 다른 컴포넌트 갱신 경고를 피한다.
   */
  markIsInitialLoaded: (
    layerId: LayerId,
    location: string,
    timestamp: string,
  ) => void;
}

export type LoadingStatusStoreInstance = StoreApi<LoadingStatusStore>;

import type { StoreApi } from 'zustand';
import type { LayerId } from '@/features/layers/shared/registry';

/**
 * (location, timestamp)별 레이어 완료 버킷. 조회는 항상 현재 location+timestamp
 * 버킷을 본다. 버킷 자체는 뷰가 바뀔 때마다 비지만, 체크리스트 로딩창은
 * hasInitialLoaded 게이트로 최초 1회만 노출한다(LoadingOverlay 참고).
 */
export type LoadedByView = Record<string, Partial<Record<LayerId, true>>>;

/** location+timestamp를 로딩 버킷 키로 합친다. */
export function loadViewKey(location: string, timestamp: string): string {
  return `${location}|${timestamp}`;
}

export interface LoadingStatusState {
  loaded: LoadedByView;
  /**
   * 앱 첫 데이터 로드(최초 뷰의 보이는 레이어 전부 도착)가 한 번이라도
   * 끝났는지. true가 되면 이후 타임스탬프 스크럽/팬·줌으로는 체크리스트
   * 로딩창을 다시 띄우지 않는다('초기 데이터 로드 시'에만 노출).
   */
  hasInitialLoaded: boolean;
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
  /** 최초 데이터 로드 완료를 한 번만 마킹한다(멱등, microtask 디퍼). */
  markInitialLoaded: () => void;
}

export type LoadingStatusStoreInstance = StoreApi<LoadingStatusStore>;

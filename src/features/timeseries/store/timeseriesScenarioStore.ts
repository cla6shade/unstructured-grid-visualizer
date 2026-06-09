import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** station에서 모달 안에서만 바꾼 태풍/시나리오 오버라이드 한 건. */
interface Override {
  typhoonId: string;
  scenarioId: string;
}

interface TimeseriesScenarioStore {
  /** station 키(`${regionKey}:${id}`)별 로컬 오버라이드. 전역 scenario store는 건드리지 않는다. */
  overrides: Record<string, Override>;
  setOverride: (key: string, value: Override) => void;
}

/**
 * 시계열 모달 안에서만 적용되는 태풍/시나리오 선택을 station 단위로 보존한다.
 * 모달은 닫으면 unmount되므로 전역 singleton store에 담아 재오픈 시 유지되게 한다.
 * 아직 키가 없는(=아직 안 연) station은 전역 store 값으로 시작한다.
 */
export const useTimeseriesScenarioStore = create<TimeseriesScenarioStore>()(
  devtools(
    (set) => ({
      overrides: {},
      setOverride: (key, value) =>
        set(
          (s) => ({ overrides: { ...s.overrides, [key]: value } }),
          undefined,
          'setOverride',
        ),
    }),
    { name: 'TimeseriesScenarioStore' },
  ),
);

import type { ModelType } from '@/lib/binaryTile';

interface SelectableLayerMeta {
  id: string;
  label: string;
  /** 데이터 모델. 셀렉터에서 모델끼리 상호배타 토글에 쓰인다. */
  model: ModelType;
  defaultVisible: boolean;
}

/**
 * 선택 가능한 레이어의 데이터-우선 메타데이터. 토글 UI(LayerSelector)와 surge↔wave
 * 상호배타가 이 목록에서 파생된다. 렌더 배선·zIndex·fetcher는 각 필드 폴더가 소유하므로
 * 여기엔 두지 않는다(레지스트리는 엔진/필드 구현에 의존하지 않는다).
 */
export const SELECTABLE_LAYER_SPECS = [
  { id: 'freeSurface', label: '자유수면', model: 'surge', defaultVisible: false },
  { id: 'waterDepth', label: '수심', model: 'surge', defaultVisible: true },
  { id: 'current', label: '해류', model: 'surge', defaultVisible: true },
  { id: 'wave', label: '파랑', model: 'wave', defaultVisible: false },
] as const satisfies readonly SelectableLayerMeta[];

export type LayerId = (typeof SELECTABLE_LAYER_SPECS)[number]['id'];

export interface LayerDef {
  id: LayerId;
  label: string;
  model: ModelType;
  defaultVisible: boolean;
}

export const LAYER_DEFS: LayerDef[] = SELECTABLE_LAYER_SPECS.map((spec) => ({
  id: spec.id,
  label: spec.label,
  model: spec.model,
  defaultVisible: spec.defaultVisible,
}));

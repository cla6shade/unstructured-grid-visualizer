import type { ModelType } from '@/lib/binaryTile';
import type { ContourTileFetcher } from '@/features/contour/types';
import type { VectorTileFetcher } from '@/features/vector/types';
import { freeSurfaceFetcher } from '../freeSurface/lib/freeSurfaceFetcher';
import { waterDepthFetcher } from '../waterDepth/lib/waterDepthFetcher';
import { currentFetcher } from '../current/lib/currentFetcher';
import { waveHeightFetcher } from '../wave/lib/waveHeightFetcher';
import { waveDirectionFetcher } from '../wave/lib/waveDirectionFetcher';

export interface CoastlineLayerSpec {
  type: 'coastline';
  id: string;
  layerName: string;
  zIndex: number;
  isSelectable: false;
}

export interface ContourLayerSpec {
  type: 'contour';
  id: string;
  layerName: string;
  label: string;
  /** 데이터 모델. 셀렉터에서 모델끼리 상호배타 토글에 쓰인다. */
  model: ModelType;
  defaultVisible: boolean;
  zIndex: number;
  isSelectable: true;
  fetcher: ContourTileFetcher;
}

export interface FlowLayerSpec {
  type: 'flow';
  id: string;
  layerName: string;
  label: string;
  model: ModelType;
  defaultVisible: boolean;
  zIndex: number;
  isSelectable: true;
  fetcher: VectorTileFetcher;
}

/** WH(contour) + THETAW(flow)를 한 레이어로 묶는 wave 스펙. */
export interface WaveLayerSpec {
  type: 'wave';
  id: string;
  layerName: string;
  label: string;
  model: ModelType;
  defaultVisible: boolean;
  zIndex: number;
  isSelectable: true;
  contourFetcher: ContourTileFetcher;
  vectorFetcher: VectorTileFetcher;
}

export type LayerSpec =
  | CoastlineLayerSpec
  | ContourLayerSpec
  | FlowLayerSpec
  | WaveLayerSpec;

export const MAP_LAYER_SPECS = [
  {
    type: 'coastline',
    id: 'coastline',
    layerName: 'coastline',
    zIndex: 0,
    isSelectable: false,
  },
  {
    type: 'contour',
    id: 'freeSurface',
    layerName: 'free-surface-contour-mesh',
    label: '자유수면',
    model: 'surge',
    defaultVisible: false,
    zIndex: 10,
    isSelectable: true,
    fetcher: freeSurfaceFetcher,
  },
  {
    type: 'contour',
    id: 'waterDepth',
    layerName: 'water-depth-contour-mesh',
    label: '수심',
    model: 'surge',
    defaultVisible: true,
    zIndex: 10,
    isSelectable: true,
    fetcher: waterDepthFetcher,
  },
  {
    type: 'flow',
    id: 'current',
    layerName: 'current-flow-lines',
    label: '해류',
    model: 'surge',
    defaultVisible: true,
    zIndex: 20,
    isSelectable: true,
    fetcher: currentFetcher,
  },
  {
    type: 'wave',
    id: 'wave',
    layerName: 'wave',
    label: '파랑',
    model: 'wave',
    defaultVisible: false,
    zIndex: 30,
    isSelectable: true,
    contourFetcher: waveHeightFetcher,
    vectorFetcher: waveDirectionFetcher,
  },
] as const satisfies readonly LayerSpec[];

type SelectableLayerSpec = Extract<
  (typeof MAP_LAYER_SPECS)[number],
  { isSelectable: true }
>;

export type LayerId = SelectableLayerSpec['id'];

export interface LayerDef {
  id: LayerId;
  label: string;
  model: ModelType;
  defaultVisible: boolean;
}

export function isSelectableLayerSpec(
  spec: LayerSpec,
): spec is SelectableLayerSpec {
  return spec.isSelectable;
}

export const SELECTABLE_LAYER_SPECS =
  MAP_LAYER_SPECS.filter(isSelectableLayerSpec);

export const LAYER_DEFS: LayerDef[] = SELECTABLE_LAYER_SPECS.map((spec) => ({
  id: spec.id,
  label: spec.label,
  model: spec.model,
  defaultVisible: spec.defaultVisible,
}));

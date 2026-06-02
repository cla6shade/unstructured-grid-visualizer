import type { ContourTileFetcher } from '@/features/contour/types';
import type { VectorTileFetcher } from '@/features/vector/types';
import { freeSurfaceFetcher } from '../freeSurface/lib/freeSurfaceFetcher';
import { waterDepthFetcher } from '../waterDepth/lib/waterDepthFetcher';
import { currentFetcher } from '../current/lib/currentFetcher';

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
  defaultVisible: boolean;
  zIndex: number;
  isSelectable: true;
  fetcher: VectorTileFetcher;
}

export type LayerSpec = CoastlineLayerSpec | ContourLayerSpec | FlowLayerSpec;

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
    defaultVisible: true,
    zIndex: 20,
    isSelectable: true,
    fetcher: currentFetcher,
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
  defaultVisible: spec.defaultVisible,
}));

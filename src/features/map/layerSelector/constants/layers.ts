export const LAYER_IDS = ['freeSurface', 'waterDepth', 'current'] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export interface LayerDef {
  id: LayerId;
  label: string;
  defaultVisible: boolean;
}

export const LAYER_DEFS: LayerDef[] = [
  { id: 'freeSurface', label: '자유수면', defaultVisible: true },
  { id: 'waterDepth', label: '수심', defaultVisible: true },
  { id: 'current', label: '해류', defaultVisible: true },
];

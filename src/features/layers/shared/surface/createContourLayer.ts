import type { Layer } from '@deck.gl/core';
import { MASK_EXTENSIONS } from '@/features/layers/coastline/lib/maskExtension';
import { ContourSurface } from './ContourSurface';
import type { SurfaceMesh } from './types';

export interface ContourLayerProps {
  id: string;
  surface: SurfaceMesh;
  visible: boolean;
  maskId?: string;
  maskInverted?: boolean;
}

export function createContourLayer({
  id,
  surface,
  visible,
  maskId,
  maskInverted = false,
}: ContourLayerProps): Layer {
  return new ContourSurface({
    id,
    data: [],
    positions: surface.positions,
    colors: surface.colors,
    indices: surface.indices,
    visible,
    ...(maskId ? { extensions: MASK_EXTENSIONS, maskId, maskInverted } : {}),
  });
}

import type { SurfaceMesh } from '../types';

export const EMPTY_SURFACE: SurfaceMesh = {
  positions: new Float32Array(0),
  colors: new Float32Array(0),
  indices: new Uint32Array(0),
};

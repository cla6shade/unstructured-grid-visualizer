import type { VectorMesh } from './types';

export const EMPTY_VECTOR_MESH: VectorMesh = {
  positions: new Float32Array(0),
  vectors: new Float32Array(0),
  indices: new Uint32Array(0),
};

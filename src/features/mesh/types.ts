import type { MeshTile, ValuesTile } from '@/lib/binaryTile';

/** 색상 변환 전 단계 — 노드별 raw 값 dict를 그대로 유지한 통합 mesh. */
export interface UnifiedMesh {
  positions: Float32Array;
  indices: Uint32Array;
  /** 각 valueKey별로 length === vertex count인 노드 값 배열 */
  valuesByKey: Record<string, Float32Array>;
}

/** 같은 좌표에서 fetch한 mesh/values를 묶은 단위. */
export interface MeshValuesPair {
  mesh: MeshTile;
  values: ValuesTile;
}

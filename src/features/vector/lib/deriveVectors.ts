import type { ValuesTile } from '@/lib/binaryTile';
import type { VectorTileFetcher } from '../types';

/**
 * values 타일을 fetcher.toVectors로 1회 변환해 length = nodeCount * 2 의 (u, v) 버퍼를 만든다.
 * 결과는 (valuesKey + 'vectors') 키로 캐싱되어 동일 timestamp 동안 재계산되지 않는다.
 */
export function deriveVectors(
  fetcher: VectorTileFetcher,
  values: ValuesTile,
): Float32Array {
  return fetcher.toVectors(values.values);
}

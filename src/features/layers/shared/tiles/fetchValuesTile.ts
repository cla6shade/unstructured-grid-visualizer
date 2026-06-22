import { fetchBinary } from '@/lib/network/fetchBinaryTile';
import { decodeValuesTile, type ValuesTile } from '@/lib/binaryTile';

/** URL 하나에 대응되는 values 타일을 받아 디코딩한다. 404/실패는 null. */
export async function fetchValuesTile(
  url: string,
  valueKeys: readonly string[],
  signal?: AbortSignal,
): Promise<ValuesTile | null> {
  const buf = await fetchBinary(url, signal, 'contour-values');
  return buf ? decodeValuesTile(buf, valueKeys) : null;
}

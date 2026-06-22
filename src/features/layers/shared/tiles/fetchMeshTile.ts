import { fetchBinary } from '@/lib/network/fetchBinaryTile';
import { decodeMeshTile, type MeshTile } from '@/lib/binaryTile';

/** URL 하나에 대응되는 mesh 타일을 받아 디코딩한다. 404/실패는 null. */
export async function fetchMeshTile(
  url: string,
  signal?: AbortSignal,
): Promise<MeshTile | null> {
  const buf = await fetchBinary(url, signal, 'contour-mesh');
  return buf ? decodeMeshTile(buf) : null;
}

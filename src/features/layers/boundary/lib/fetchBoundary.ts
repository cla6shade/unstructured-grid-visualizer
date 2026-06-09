import { apiFetch } from '@/lib/network/apiFetch';

const EMPTY: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * `/api/subset/boundary/{location}` — 해당 항구를 정확히 잘라낸 GeoJSON 경계를 받아온다.
 * z=6 베이스를 boundary 형상대로 도려내고(maskInverted) z=11 디테일을 boundary 안쪽으로
 * 클리핑하는 deck.gl 마스크 레이어의 소스로 쓰인다. 404/실패 시 빈 FeatureCollection.
 */
export async function fetchBoundary(
  location: string,
): Promise<GeoJSON.FeatureCollection> {
  const res = await apiFetch(`/api/subset/boundary/${location}`);
  if (res.status === 404) return EMPTY;
  if (!res.ok) {
    console.error(`[boundary] ${location} failed`, res.status);
    return EMPTY;
  }
  return (await res.json()) as GeoJSON.FeatureCollection;
}

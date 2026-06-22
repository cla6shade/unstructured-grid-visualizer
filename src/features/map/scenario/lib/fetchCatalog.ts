import { apiFetch } from '@/features/auth/lib/apiFetch';
import type { SubsetCatalog } from '@/features/map/scenario/types';

export async function fetchCatalog(): Promise<SubsetCatalog> {
  // catalog는 시나리오 갱신 시 바뀌므로 force-cache를 끈다.
  const res = await apiFetch('/api/subset/catalog', { cache: 'default' });
  if (!res.ok) throw new Error(`fetchCatalog failed: ${res.status}`);
  return (await res.json()) as SubsetCatalog;
}

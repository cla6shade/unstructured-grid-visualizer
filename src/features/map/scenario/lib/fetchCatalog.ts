import { axiosInstance } from '@/lib/network/axiosInstance';
import type { SubsetCatalog } from '@/features/map/scenario/lib/types';

export async function fetchCatalog(): Promise<SubsetCatalog> {
  const { data } = await axiosInstance.get<SubsetCatalog>(
    '/api/subset/catalog',
  );
  return data;
}

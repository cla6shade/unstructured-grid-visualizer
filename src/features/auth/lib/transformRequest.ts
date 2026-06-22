import { API_KEY_STORAGE_KEY } from '@/features/auth/constants';
import { getTileServerUrl } from '@/features/auth/lib/tileServer';

export function transformRequest(url: string, resourceType?: string) {
  const tileServerUrl = getTileServerUrl();
  if (resourceType === 'Tile' && tileServerUrl && url.startsWith(tileServerUrl)) {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return {
      url,
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    };
  }
  return { url };
}

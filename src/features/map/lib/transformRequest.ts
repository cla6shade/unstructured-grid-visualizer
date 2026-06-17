import { API_KEY_STORAGE_KEY } from '@/constants/auth';
import { getTileServerUrl } from '@/lib/network/tileServer';

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

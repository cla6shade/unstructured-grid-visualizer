import { API_KEY_STORAGE_KEY } from '@/constants/auth';

const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL as string;

export function transformRequest(url: string, resourceType?: string) {
  if (resourceType === 'Tile' && url.startsWith(TILE_SERVER_URL)) {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return {
      url,
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    };
  }
  return { url };
}

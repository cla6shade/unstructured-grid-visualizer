import { API_KEY_STORAGE_KEY } from '@/constants/auth';

const BASE_URL = import.meta.env.VITE_TILE_SERVER_URL ?? '';

function buildUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (!BASE_URL) return url;
  return BASE_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`);
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (apiKey) headers.set('x-api-key', apiKey);
  return headers;
}

/**
 * baseURL + x-api-key를 자동 적용하는 native fetch wrapper.
 * 타일 서버 응답 대부분이 URL 단위 불변이라 기본 cache는 'force-cache'.
 * 변동성 있는 엔드포인트는 호출 시 cache를 명시적으로 덮어쓰면 된다.
 */
export function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(buildUrl(url), {
    cache: 'force-cache',
    ...init,
    headers: buildHeaders(init?.headers),
  });
}

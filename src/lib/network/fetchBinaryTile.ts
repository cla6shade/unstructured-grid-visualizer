import { apiFetch } from '@/lib/network/apiFetch';

/** binary tile fetch. 404는 null을 반환하고, abort는 그대로 throw한다. */
export async function fetchBinary(
  url: string,
  signal?: AbortSignal,
  label = 'binary',
): Promise<ArrayBuffer | null> {
  try {
    const res = await apiFetch(url, { method: 'GET', signal });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[${label}] ${url} failed`, res.status);
      return null;
    }
    return await res.arrayBuffer();
  } catch (err) {
    if (signal?.aborted) throw err;
    console.error(`[${label}] ${url} failed`, err);
    return null;
  }
}

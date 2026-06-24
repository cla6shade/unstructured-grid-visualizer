import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/features/auth/lib/apiFetch';

/** POST /api/subset/run 응답(job 상태) 중 화면에서 쓰는 필드만. */
export interface SubsetRunResult {
  job_id?: string;
  status?: string;
}

/**
 * 서브셋 재생성 작업을 강제로 한 번 트리거한다(POST /api/subset/run).
 * 결과물 갱신용 mutation이라 캐시는 'no-store'로 명시한다.
 */
async function runSubset(): Promise<SubsetRunResult> {
  const res = await apiFetch('/api/subset/run', {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`서브셋 실행 요청에 실패했습니다 (HTTP ${res.status}).`);
  }
  return (await res.json().catch(() => ({}))) as SubsetRunResult;
}

export function useRunSubset() {
  return useMutation({ mutationFn: runSubset });
}

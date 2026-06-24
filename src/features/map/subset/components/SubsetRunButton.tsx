import { useState } from 'react';
import { Scissors } from 'lucide-react';
import { useRunSubset } from '@/features/map/subset/hooks/useRunSubset';
import { SubsetConfirmModal } from '@/features/map/subset/components/SubsetConfirmModal';

/**
 * 서브셋 재생성 버튼. 누르면 확인 모달을 띄우고, [실행]을 눌러야 요청을 보낸다.
 * 결과(성공/실패)는 모달 안에서 표시한다.
 */
export function SubsetRunButton() {
  const [open, setOpen] = useState(false);
  const mutation = useRunSubset();

  const openModal = () => {
    mutation.reset();
    setOpen(true);
  };

  const closeModal = () => {
    if (mutation.isPending) return; // 요청 진행 중에는 닫기 금지
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 rounded-[8px] bg-background/85 px-3 py-2 text-xs font-medium text-foreground-muted cursor-pointer transition-all hover:brightness-110 pointer-events-auto select-none"
      >
        <Scissors size={14} className="shrink-0" />
        서브셋 재생성
      </button>
      <SubsetConfirmModal
        open={open}
        pending={mutation.isPending}
        error={mutation.isError ? (mutation.error as Error).message : null}
        success={mutation.isSuccess}
        jobId={mutation.data?.job_id ?? null}
        onCancel={closeModal}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}

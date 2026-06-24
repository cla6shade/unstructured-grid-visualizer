import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

interface SubsetConfirmModalProps {
  open: boolean;
  /** 요청 진행 중. true면 닫기·취소를 막는다. */
  pending: boolean;
  /** 실패 메시지(없으면 null). */
  error: string | null;
  /** 요청 성공 여부. */
  success: boolean;
  /** 성공 시 서버가 준 작업 ID(있으면 표시). */
  jobId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 서브셋 재생성 확인 모달. window.alert를 쓰지 않고 직접 그린 다이얼로그다.
 * - 실행 전: 경고 문구 + [취소]/[실행]
 * - 실행 후: 성공/실패 상태를 모달 안에서 보여준다.
 * backdrop 클릭·X·Esc로 닫되, 요청 진행 중에는 닫기를 막는다.
 */
export function SubsetConfirmModal({
  open,
  pending,
  error,
  success,
  jobId,
  onCancel,
  onConfirm,
}: SubsetConfirmModalProps) {
  // Esc로 닫기(진행 중 제외).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-8"
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="flex w-[min(460px,92vw)] flex-col rounded-[12px] bg-map-surface-deep shadow-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="서브셋 재생성 확인"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4 border-b border-[#33353b] px-6 py-4">
          <span className="text-base font-medium text-map-content">
            서브셋 재생성
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-light text-map-icon cursor-pointer transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {!success ? (
            <>
              <div className="flex gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-map-content">
                  <p>서브셋 결과를 처음부터 다시 생성합니다.</p>
                  <p className="text-map-content-faint">
                    <strong className="font-medium text-map-content-strong">
                      기존의 서브셋 디렉터리를 삭제했거나 옮겼을 경우에만
                    </strong>{' '}
                    실행하세요.
                  </p>
                </div>
              </div>
              {error && (
                <p className="rounded-[6px] bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="flex gap-3">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-400"
              />
              <div className="flex flex-col gap-1 text-sm text-map-content">
                <p>서브셋 재생성을 시작했습니다.</p>
                {jobId && (
                  <p className="text-xs text-map-content-faint">
                    작업 ID: {jobId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t border-[#33353b] px-6 py-4">
          {!success ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="rounded-[8px] px-4 py-2 text-sm text-map-content-faint cursor-pointer transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-medium text-white cursor-pointer transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && <Loader2 size={16} className="animate-spin" />}
                {pending ? '실행 중…' : '실행'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[8px] bg-surface-light px-4 py-2 text-sm text-map-content cursor-pointer transition-all hover:brightness-110"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** primary 색 조합 스피너. 크기/두께는 className으로 지정한다(예: "h-4 w-4 border-2"). */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-primary-muted border-t-primary ${className}`}
    />
  );
}

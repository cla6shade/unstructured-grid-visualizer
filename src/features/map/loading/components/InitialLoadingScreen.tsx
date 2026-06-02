import { Spinner } from './Spinner';

export interface LoadingRow {
  id: string;
  label: string;
  loaded: boolean;
}

/** 카탈로그도 레이어와 동일한 행으로 취급하기 위한 공용 id/label. */
export const CATALOG_ROW = { id: 'catalog', label: '카탈로그' } as const;

/**
 * 화면 전체를 map-canvas 색으로 덮는 로딩 화면. rows의 각 항목(카탈로그·레이어)을
 * 동일한 형식으로 나열하고, 로딩 중이면 스피너, 완료면 체크를 보여준다.
 * (catalog suspense fallback과 LoadingOverlay가 공유)
 */
export function InitialLoadingScreen({ rows = [] }: { rows?: LoadingRow[] }) {
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-map-canvas select-none">
      <h2 className="text-base font-semibold text-foreground">데이터 로드 중</h2>
      <ul className="flex min-w-[180px] flex-col gap-2.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-6 text-sm"
          >
            <span className="text-foreground">{row.label}</span>
            {row.loaded ? <Check /> : <Spinner className="h-4 w-4 border-2" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Check() {
  return (
    <svg
      className="h-4 w-4 text-primary"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/** InitialLoadingScreen이 한 줄로 표시하는 항목(카탈로그·레이어 공통). */
export interface LoadingRow {
  id: string;
  label: string;
  loaded: boolean;
}

/** 카탈로그도 레이어와 동일한 행으로 취급하기 위한 공용 id/label. */
export const CATALOG_ROW = { id: 'catalog', label: '카탈로그' } as const;

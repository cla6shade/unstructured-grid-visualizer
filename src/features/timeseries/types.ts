// /api/timeseries/catalog 응답 형태. region별로 시계열 관측소(stations) 목록을 담는다.

export interface TimeseriesStation {
  id: string;
  lat: number;
  lon: number;
}

export interface TimeseriesVariable {
  id: string;
  model: string;
  variable: string;
  label: string;
}

export interface TimeseriesRegionTyphoon {
  typhoon_id: string;
  typhoon_name: string;
  scenario_ids: string[];
}

export interface TimeseriesRegion {
  /** 대문자 region 식별자 (예: "BUSAN1") */
  region: string;
  /** 소문자 region_key (예: "busan1") — location 매핑에 사용 */
  region_key: string;
  label: string;
  typhoons: TimeseriesRegionTyphoon[];
  stations: TimeseriesStation[];
  variables: TimeseriesVariable[];
}

export interface TimeseriesCatalog {
  regions: TimeseriesRegion[];
}

/**
 * 마커 단위(= region 한정 station). busan1/busan2는 같은 station id(B00 등)를 서로 다른
 * 좌표로 공유하므로, id만으로 dedupe하지 않고 region_key로 키를 분리한다.
 */
export interface SelectedStation {
  regionKey: string;
  id: string;
  lat: number;
  lon: number;
}

/** 시계열 데이터 한 점. t는 KST naive 문자열("2003-09-04 09:00:00", 공백 구분·tz 없음). */
export interface TimeseriesPoint {
  t: string;
  value: number;
}

/** `/api/timeseries/{region}/{typhoon}/{scenario}/{station}/{variable}` 응답. */
export interface TimeseriesSeries {
  region: string;
  typhoon_id: string;
  scenario_id: string;
  station: string;
  variable: string;
  model: string;
  label: string;
  points: TimeseriesPoint[];
}

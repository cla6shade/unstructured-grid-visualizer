import type { StoreApi } from 'zustand';

export interface ScenarioTimes {
  typhoon_id: string;
  scenario_id: string;
  time_count: number;
  /** KST 기준 ISO-like 문자열 (예: "2003-09-04T00:00:00", timezone 미포함) */
  first_time: string;
  last_time: string;
}

export interface CatalogTyphoon {
  typhoon_id: string;
  typhoon_name: string;
  scenario_ids: string[];
}

export interface CatalogVariable {
  layer: string;
  label: string;
}

export interface CatalogAvailability {
  typhoon_id: string;
  scenario_id: string;
  locations: string[];
  layers: string[];
  layers_by_location: Record<string, string[]>;
}

export interface SubsetCatalog {
  typhoons: CatalogTyphoon[];
  locations: string[];
  variables: CatalogVariable[];
  scenario_times: ScenarioTimes[];
  availability: CatalogAvailability[];
}

export interface ScenarioState {
  catalog: SubsetCatalog;
  scenarioId: string;
  typhoonId: string;
  /** KST 타임존 표기 포함 ISO 문자열 (예: "2022-09-01T12:00:00+09:00") */
  timestamp: string;
}

export interface ScenarioStore extends ScenarioState {
  setScenarioId: (scenarioId: string) => void;
  setTyphoonId: (typhoonId: string) => void;
  setTimestamp: (timestamp: string) => void;
}

export type ScenarioStoreInstance = StoreApi<ScenarioStore>;

import type { SubsetCatalog } from '@/features/map/scenario/types';

/**
 * 태풍 id의 앞 두 자리로 연도를 도출한다. 예: "0314" → 2003, "2211" → 2022.
 * id는 항상 숫자 문자열(YY + 일련번호)이라는 카탈로그 규약을 따른다.
 */
export function typhoonYear(typhoonId: string): number {
  return 2000 + Number(typhoonId.slice(0, 2));
}

/** 카탈로그 태풍들의 distinct 연도를 내림차순으로 반환한다(연도 필터 옵션). */
export function listTyphoonYears(catalog: SubsetCatalog): number[] {
  const years = new Set(catalog.typhoons.map((t) => typhoonYear(t.typhoon_id)));
  return [...years].sort((a, b) => b - a);
}

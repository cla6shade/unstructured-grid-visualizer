import { TILE_SERVER_STORAGE_KEY } from '@/features/auth/constants'

/**
 * 타일/데이터 서버 base URL. 빌드 타임 env가 아니라 초기 설정 화면에서 입력해
 * localStorage에 저장한 값을 런타임에 읽는다(standalone 재빌드 없이 현장별 주소 설정).
 * 항상 호출 시점에 읽어야 한다 — 모듈 로드(앱 시작) 시점엔 아직 입력 전일 수 있다.
 */
export function getTileServerUrl(): string {
  return localStorage.getItem(TILE_SERVER_STORAGE_KEY)?.trim() ?? ''
}

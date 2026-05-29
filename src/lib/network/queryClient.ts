import { QueryClient } from '@tanstack/react-query';

/**
 * 타일/메시는 URL(=query key) 단위로 사실상 불변이라
 * staleTime/gcTime을 길게 잡아 세션 내 dedupe·재활용을 극대화.
 * 컴포넌트 unmount나 viewport 이동으로 reference가 끊겨도 일정 시간 캐시 유지.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

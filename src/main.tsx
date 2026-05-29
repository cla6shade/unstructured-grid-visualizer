import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { MapRoot } from '@/features/map/MapRoot'
import { AuthBoundary } from '@/features/auth/components/AuthBoundary'
import { queryClient } from '@/lib/network/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthBoundary>
        <MapRoot />
      </AuthBoundary>
    </QueryClientProvider>
  </StrictMode>,
)

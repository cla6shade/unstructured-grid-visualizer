import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MapRoot } from '@/features/map/MapRoot'
import { AuthBoundary } from '@/features/auth/components/AuthBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthBoundary>
      <MapRoot />
    </AuthBoundary>
  </StrictMode>,
)

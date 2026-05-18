import { useState, type ReactNode } from 'react'
import { API_KEY_STORAGE_KEY } from '@/constants/auth'
import { ApiKeyPage } from '@/features/auth/components/ApiKeyPage'

interface AuthBoundaryProps {
  children: ReactNode
}

export function AuthBoundary({ children }: AuthBoundaryProps) {
  const [authed, setAuthed] = useState(
    () => !!localStorage.getItem(API_KEY_STORAGE_KEY),
  )

  if (!authed) {
    return <ApiKeyPage onSubmit={() => setAuthed(true)} />
  }

  return <>{children}</>
}

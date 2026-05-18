import { useState } from 'react'
import { API_KEY_STORAGE_KEY } from '@/constants/auth'

interface ApiKeyPageProps {
  onSubmit: () => void
}

export function ApiKeyPage({ onSubmit }: ApiKeyPageProps) {
  const [key, setKey] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) return
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed)
    onSubmit()
  }

  return (
    <div className="flex items-center justify-center w-dvw h-dvh bg-neutral-950">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm px-6">
        <h1 className="text-white text-lg font-semibold">API Key</h1>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API key"
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/10 focus:border-white/30 focus:outline-none font-mono text-sm"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-white text-neutral-950 font-semibold text-sm hover:bg-white/90 transition-colors cursor-pointer"
        >
          Continue
        </button>
      </form>
    </div>
  )
}

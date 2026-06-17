import { useState } from 'react'
import { API_KEY_STORAGE_KEY, TILE_SERVER_STORAGE_KEY } from '@/constants/auth'

interface ApiKeyPageProps {
  onSubmit: () => void
}

export function ApiKeyPage({ onSubmit }: ApiKeyPageProps) {
  const [key, setKey] = useState('')
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem(TILE_SERVER_STORAGE_KEY) ?? '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedKey = key.trim()
    const trimmedUrl = serverUrl.trim().replace(/\/$/, '')
    if (!trimmedKey || !trimmedUrl) return
    localStorage.setItem(TILE_SERVER_STORAGE_KEY, trimmedUrl)
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey)
    onSubmit()
  }

  return (
    <div className="flex items-center justify-center w-dvw h-dvh bg-neutral-950">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm px-6">
        <h1 className="text-white text-lg font-semibold">서버 설정</h1>
        <label className="flex flex-col gap-1.5">
          <span className="text-white/70 text-xs">서버 주소</span>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/10 focus:border-white/30 focus:outline-none font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-white/70 text-xs">API Key</span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/10 focus:border-white/30 focus:outline-none font-mono text-sm"
          />
        </label>
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

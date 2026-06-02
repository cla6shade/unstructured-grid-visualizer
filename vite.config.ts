import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // /koos 하위 경로 배포. asset을 /koos/assets/...로 내보내 nginx location /koos/와 맞춘다.
  // (koos-front 웹 빌드와 동일 규약)
  base: '/koos',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    allowedHosts: ['home.cla6sha.de']
  }
})

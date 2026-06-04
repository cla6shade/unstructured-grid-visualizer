import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 웹 배포: /koos 하위 경로. asset을 /koos/assets/...로 내보내 nginx location /koos/와 맞춘다.
  // (koos-front 웹 빌드와 동일 규약)
  // Electron 패키징(BUILD_TARGET=electron): file://에서 로드하므로 상대 경로('./')로 내보낸다.
  base: process.env.BUILD_TARGET === 'electron' ? './' : '/koos',
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

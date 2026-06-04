// Electron 개발 실행기:
//  1) electron main/preload를 CJS로 컴파일
//  2) vite dev 서버 기동(BUILD_TARGET=electron → base './')
//  3) 포트가 열리면 Electron을 띄우고 dev 서버 URL을 주입(HMR 사용)
import { spawn, execSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import net from 'node:net'
import process from 'node:process'

const PORT = 5173
const DEV_URL = `http://localhost:${PORT}/`

// 1) main/preload 컴파일 (+ dist-electron/package.json)
execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' })
mkdirSync('dist-electron', { recursive: true })
writeFileSync('dist-electron/package.json', JSON.stringify({ type: 'commonjs' }) + '\n')

// 2) vite dev 서버
const vite = spawn('vite', ['--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BUILD_TARGET: 'electron' },
})

function waitForPort(port, retriesLeft = 100) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = net.connect(port, '127.0.0.1')
      sock.once('connect', () => {
        sock.destroy()
        resolve()
      })
      sock.once('error', () => {
        sock.destroy()
        if (--retriesLeft <= 0) reject(new Error('vite dev 서버가 시작되지 않았습니다'))
        else setTimeout(attempt, 300)
      })
    }
    attempt()
  })
}

// 3) 포트 대기 후 Electron 기동
await waitForPort(PORT)

const electron = spawn('electron', ['.'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_DEV_SERVER_URL: DEV_URL },
})

electron.on('close', () => {
  vite.kill()
  process.exit(0)
})

process.on('SIGINT', () => {
  electron.kill()
  vite.kill()
  process.exit(0)
})

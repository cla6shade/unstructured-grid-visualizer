import { app, BrowserWindow, session, shell } from 'electron'
import path from 'node:path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: 'KOOS',
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
    webPreferences: {
      // tsc가 CommonJS로 컴파일하므로 __dirname 사용 가능. (dist-electron/preload.js)
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // 패키징된 dist/index.html을 file://로 로드한다. (dist-electron/main.js 기준 ../dist/index.html)
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  // 외부 링크는 OS 기본 브라우저로 연다.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// 패키징된 앱은 file://(origin = null)에서 동작하므로 타일 서버 요청이 cross-origin이 된다.
// (웹 배포는 타일 서버와 동일 출처라 CORS가 필요 없다.) 응답에 CORS 헤더가 없으면
// 신뢰하는 first-party 데이터 백엔드에 한해 허용 헤더를 보강해 데스크톱에서도 동작하게 한다.
function enableCorsForDataBackend() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    const hasAcao = Object.keys(headers).some(
      (k) => k.toLowerCase() === 'access-control-allow-origin',
    )
    if (!hasAcao) {
      headers['Access-Control-Allow-Origin'] = ['*']
      headers['Access-Control-Allow-Headers'] = ['*']
    }
    callback({ responseHeaders: headers })
  })
}

app.whenReady().then(() => {
  enableCorsForDataBackend()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

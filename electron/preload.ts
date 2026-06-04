import { contextBridge } from 'electron'

// 렌더러(웹 앱)는 순수 브라우저 코드라 별도 브릿지가 필수는 아니지만,
// 데스크톱 환경 식별용 최소 정보만 안전하게 노출한다. (contextIsolation 유지)
contextBridge.exposeInMainWorld('koosDesktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
})

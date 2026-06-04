// electron/main.ts + preload.ts를 CommonJS로 컴파일해 dist-electron/에 내보낸다.
// 프로젝트 루트 package.json은 "type": "module"이라, dist-electron에 별도
// package.json("type": "commonjs")을 써서 .js를 CJS로 해석하게 한다.
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' })

mkdirSync('dist-electron', { recursive: true })
writeFileSync('dist-electron/package.json', JSON.stringify({ type: 'commonjs' }) + '\n')

console.log('✓ electron main/preload compiled → dist-electron/')

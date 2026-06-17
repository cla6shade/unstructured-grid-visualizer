// dist/(웹 빌드) + vendor/*.rpm(Chrome, Vulkan) + packaging/standalone/(설치·실행 템플릿)을
// staging 디렉터리로 모아 release/koos-standalone-<version>-x86_64.tar.gz 를 만든다.
//
// 선행 조건:
//   - pnpm build:standalone 으로 dist/ 가 빌드돼 있어야 한다 (BUILD_TARGET=electron, 상대경로 base).
//   - vendor/ 에 RPM 파일이 있어야 한다 (CI: curl 로 다운로드 / 로컬: 직접 배치).
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync, chmodSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const VENDOR = path.join(ROOT, 'vendor')
const TEMPLATES = path.join(ROOT, 'packaging', 'standalone')
const RELEASE = path.join(ROOT, 'release')

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (!existsSync(DIST)) {
  fail("dist/ 가 없습니다. 먼저 'pnpm build:standalone' 으로 빌드하세요.")
}
const rpms = existsSync(VENDOR) ? readdirSync(VENDOR).filter((f) => f.endsWith('.rpm')) : []
if (rpms.length === 0) {
  fail('vendor/*.rpm 이 없습니다. Chrome/Vulkan RPM 을 vendor/ 에 두거나 CI 에서 다운로드하세요.')
}

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const version = pkg.version
const name = `koos-standalone-${version}`
const stage = path.join(RELEASE, name)

console.log(`==> staging: ${path.relative(ROOT, stage)}`)
rmSync(stage, { recursive: true, force: true })
mkdirSync(stage, { recursive: true })

// 웹 빌드 + RPM
cpSync(DIST, path.join(stage, 'dist'), { recursive: true })
cpSync(VENDOR, path.join(stage, 'vendor'), { recursive: true })
console.log(`    dist/ + vendor/ (${rpms.join(', ')})`)

// 설정
mkdirSync(path.join(stage, 'config'), { recursive: true })
cpSync(path.join(TEMPLATES, 'koos.conf'), path.join(stage, 'config', 'koos.conf'))

// 스크립트/메타 (실행 권한 필요한 것 분리)
// Chrome RPM 서명 검증은 CI(standalone.yml)에서 하므로 서명키는 번들에 넣지 않는다.
const EXECUTABLE = ['install.sh', 'uninstall.sh', 'koos-launch.sh']
const PLAIN = ['koos.desktop', 'README.txt']
for (const f of [...EXECUTABLE, ...PLAIN]) {
  cpSync(path.join(TEMPLATES, f), path.join(stage, f))
}
for (const f of EXECUTABLE) {
  chmodSync(path.join(stage, f), 0o755)
}

// tar.gz (gnu/bsd tar 공통 옵션). release/ 기준 상대 경로로 묶어 루트 디렉터리를 보존.
const tarball = path.join(RELEASE, `${name}-x86_64.tar.gz`)
rmSync(tarball, { force: true })
execSync(`tar -C "${RELEASE}" -czf "${tarball}" "${name}"`, { stdio: 'inherit' })

console.log(`✓ ${path.relative(ROOT, tarball)}`)

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // rAF 루프 기반 흐름 훅(useFlowLines/useFlowIcons)이 의도적으로 render 중 ref를
      // 갱신하고 effect deps를 최소화한다(성능). 두 룰을 비활성화한다.
      'react-hooks/refs': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])

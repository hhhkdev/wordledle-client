import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 부모 디렉토리의 .env.local에서 Supabase 환경변수 로드
  const env = loadEnv(mode, resolve(__dirname, '..'), '')

  return {
    plugins: [
      react(),
      webExtension({ manifest: 'manifest.json' }),
    ],
    define: {
      __SUPABASE_URL__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''),
    },
  }
})

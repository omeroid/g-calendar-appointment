import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    // GitHub Pagesでのデプロイに対応
    base: process.env.GITHUB_PAGES ? '/g-calendar-appointment/' : '/',
    
    // 環境変数をクライアントに公開
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || '')
    },
    
    publicDir: 'public',
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  }
})
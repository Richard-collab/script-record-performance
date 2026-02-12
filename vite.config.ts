import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // 如果设置了环境变量，则不使用代理（直接访问后端）
  // 否则使用代理以避免 CORS 错误
  const useProxy = !env.VITE_API_BASE_URL
  
  return {
    plugins: [react()],
    server: useProxy ? {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_API_TARGET || 'http://192.168.23.176:3003',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/corpus': {
          target: env.VITE_PROXY_CORPUS_TARGET || 'http://192.168.23.176:3006',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/corpus/, '')
        }
      }
    } : {}
  }
})

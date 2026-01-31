import { defineConfig, loadEnv } from "vite"
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const PORT = env.PORT || 5173
  const API_URL = env.VITE_API_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: parseInt(PORT),
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
        },
        '/ws': {
          target: API_URL,
          ws: true,
          changeOrigin: true,
          rewriteWsOrigin: true,
        },
      },
    },
  }
})

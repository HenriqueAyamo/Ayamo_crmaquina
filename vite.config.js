import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Em desenvolvimento o Vite (5173) e o Worker (8788) são origens diferentes,
    // e o cookie de sessão é SameSite=Strict — o navegador não o mandaria de uma
    // para a outra. O proxy faz /api sair do mesmo endereço da página, então a
    // sessão funciona igual em produção, onde o Worker serve o próprio frontend.
    proxy: {
      '/api': {
        target: process.env.VITE_WORKER_URL ?? 'http://127.0.0.1:8788',
        changeOrigin: false,
      },
    },
  },
})

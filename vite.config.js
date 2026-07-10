import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

// Marcador de versión visible en la UI: cambia en cada deploy (SHA corto de git
// + fecha de build). Sirve para saber de un vistazo si el dispositivo ya está
// sirviendo el bundle nuevo o una copia cacheada por el service worker.
function buildVersion() {
  let sha = 'dev'
  try {
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim()
  } catch { /* sin git (p. ej. tarball): dejamos 'dev' */ }
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `${sha} · ${date}`
}

export default defineConfig({
  plugins: [vue()],
  base: '/trips/',
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  // TEMPORAL (diagnóstico): sin minificar para que el stack de errores del
  // banner sea legible (nombres de función y módulo). Revertir al cerrar.
  build: {
    minify: false,
  },
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

// ── Capturador de errores visible en pantalla (diagnóstico) ──────────────────
// En móvil no hay consola a mano; este banner muestra el primer error de JS que
// ocurra (mensaje + primera línea de stack), para poder leerlo y localizar el
// bug. Toca el banner para copiar / ocultar. Temporal: quitar cuando cerremos.
function showErrorBanner(label, err) {
  try {
    const msg = err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n')
      : (err && err.message) || String(err)
    let el = document.getElementById('debug-error-banner')
    if (!el) {
      el = document.createElement('div')
      el.id = 'debug-error-banner'
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;' +
        'background:#b00020;color:#fff;font:12px/1.4 monospace;padding:8px 12px;' +
        'white-space:pre-wrap;max-height:45vh;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,.4)'
      el.addEventListener('click', () => {
        navigator.clipboard?.writeText(el.textContent || '').catch(() => {})
        el.style.display = 'none'
      })
      document.body.appendChild(el)
    }
    el.style.display = 'block'
    el.textContent = `⚠️ ${label}: ${msg}\n(toca para copiar/ocultar)`
  } catch { /* nunca romper por el propio banner */ }
}

window.addEventListener('error', (e) => showErrorBanner('error', e.error || e.message))
window.addEventListener('unhandledrejection', (e) => showErrorBanner('promise', e.reason))

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  showErrorBanner(`vue:${info}`, err)
  console.error(err)
}
app.use(createPinia())
app.mount('#app')

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js')
  })
}

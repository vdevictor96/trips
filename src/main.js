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
    // Safari NO incluye el mensaje en err.stack (solo frames), así que lo
    // mostramos explícito y primero — es lo que de verdad señala la causa.
    const name = (err && err.name) || ''
    const message = (err && err.message) || String(err)
    const stack = err && err.stack ? err.stack.split('\n').slice(0, 4).join('\n') : ''
    const msg = `${name ? name + ': ' : ''}${message}\n${stack}`
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

// ── HUD de diagnóstico (temporal): muestra estado en pantalla ────────────────
// Sirve para ver, en el móvil real, si los markers de restaurantes/cafés están
// construidos y cuántos son visibles al tocar la pastilla/ojo.
window.__hud = function (text) {
  try {
    let el = document.getElementById('debug-hud')
    if (!el) {
      el = document.createElement('div')
      el.id = 'debug-hud'
      // Arriba (no abajo): abajo taparía las pastillas del sheet colapsado.
      el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99998;' +
        'background:#0b3d91;color:#fff;font:11px/1.4 monospace;padding:6px 10px;' +
        'white-space:pre-wrap;box-shadow:0 2px 8px rgba(0,0,0,.4)'
      el.addEventListener('click', () => { el.style.display = 'none' })
      document.body.appendChild(el)
    }
    el.style.display = 'block'
    el.textContent = '🔎 ' + text + '  (toca para ocultar)'
  } catch { /* nunca romper por el HUD */ }
}

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

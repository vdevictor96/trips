import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'theme-preference'

// Singleton state — shared across all consumers
const preference = ref(localStorage.getItem(STORAGE_KEY) || 'system')
const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// Listen for OS-level theme changes
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', (e) => { systemDark.value = e.matches })

export const isDark = computed(() => {
  if (preference.value === 'system') return systemDark.value
  return preference.value === 'dark'
})

// Keep DOM in sync
function applyTheme() {
  const dark = isDark.value
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = dark ? '#1a1a2e' : '#f5f5f7'
}

watch(isDark, applyTheme, { immediate: true })

export function useTheme() {
  function setTheme(mode) {
    preference.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return { preference, isDark, setTheme }
}

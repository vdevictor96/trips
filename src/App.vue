<template>
  <template v-if="showApp">
    <TripSelector v-if="!store.trip" />
    <TripViewer v-else @back="handleBack" />
    <ThemeToggle />
    <LoveFooter />
  </template>
  <LoginGate v-else-if="showLogin" />
</template>

<script setup>
import { computed, watch } from 'vue'
import { useTripStore } from './stores/trip.js'
import { hasConfig } from './firebase.js'
import { useAuth } from './composables/useAuth.js'
import TripSelector from './components/TripSelector.vue'
import TripViewer from './components/TripViewer.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import LoveFooter from './components/LoveFooter.vue'
import LoginGate from './components/LoginGate.vue'

const store = useTripStore()
const { user, authReady, initAuth } = useAuth()

// No Firebase configured means no gate; with Firebase, require a signed-in
// session. While Firebase resolves the persisted session (!authReady) we render
// nothing, to avoid flashing the login screen.
const showApp = computed(() => !hasConfig || (authReady.value && !!user.value))
const showLogin = computed(() => hasConfig && authReady.value && !user.value)

initAuth()

// Load data only once the app can be shown (authenticated)
let booted = false
watch(showApp, async (ok) => {
  if (!ok || booted) return
  booted = true
  await store.fetchTripsIndex()
  // Deep link
  const hash = location.hash.replace('#', '')
  if (hash) {
    const found = store.tripsIndex.find(t => t.id === hash)
    if (found) await store.loadTrip(found.id)
  }
}, { immediate: true })

function handleBack() {
  store.unloadTrip()
  document.title = 'Nuestros viajes'
  location.hash = ''
}

// Handle browser back/forward
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '')
  if (!hash && store.trip) handleBack()
})
</script>

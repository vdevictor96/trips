<template>
  <TripSelector v-if="!store.trip" />
  <TripViewer v-else @back="handleBack" />
  <ThemeToggle />
  <LoveFooter />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useTripStore } from './stores/trip.js'
import TripSelector from './components/TripSelector.vue'
import TripViewer from './components/TripViewer.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import LoveFooter from './components/LoveFooter.vue'

const store = useTripStore()

onMounted(async () => {
  await store.fetchTripsIndex()
  // Deep link
  const hash = location.hash.replace('#', '')
  if (hash) {
    const found = store.tripsIndex.find(t => t.id === hash)
    if (found) await store.loadTrip(found.id)
  }
})

function handleBack() {
  store.unloadTrip()
  document.title = 'Nuestros Viajes'
  location.hash = ''
}

// Handle browser back/forward
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '')
  if (!hash && store.trip) handleBack()
})
</script>

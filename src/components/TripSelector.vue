<template>
  <div class="trip-selector">
    <div class="trip-selector-header">
      <h1>Nuestros viajes</h1>
      <p>Selecciona un destino</p>
    </div>
    <div class="trip-grid">
      <div
        v-for="t in store.tripsIndex"
        :key="t.id"
        class="trip-card"
        @click="selectTrip(t.id)"
      >
        <div class="trip-card-flag">
          <img :src="flagUrl(t.emoji)" :alt="t.country" />
        </div>
        <div class="trip-card-body">
          <div class="trip-card-title">{{ t.title }}</div>
          <div class="trip-card-dates">{{ t.dates }}</div>
          <div class="trip-card-meta">
            <span>{{ t.days }} días</span>
            <span>{{ t.places }} sitios</span>
            <span>{{ t.city }}, {{ t.country }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()

function flagUrl(emoji) {
  const code = [...emoji]
    .map(c => c.codePointAt(0))
    .filter(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)
    .map(cp => String.fromCharCode(cp - 0x1F1E6 + 65))
    .join('')
    .toLowerCase()
  return `https://flagcdn.com/w640/${code}.png`
}

async function selectTrip(tripId) {
  await store.loadTrip(tripId)
  document.title = store.trip.title
  location.hash = store.trip.id
}
</script>

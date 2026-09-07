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
          <img v-if="flagUrl(t.emoji)" :src="flagUrl(t.emoji)" :alt="t.country" />
          <span v-else class="trip-card-emoji">{{ t.emoji }}</span>
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

// Devuelve la URL de la bandera solo si el emoji es un par de indicadores
// regionales (🇪🇸). Con cualquier otro emoji (🌋) el código salía vacío y se
// pedía `flagcdn.com/w640/.png`, que da 404 y deja la tarjeta con la imagen
// rota; en ese caso devolvemos null y la tarjeta pinta el emoji tal cual.
function flagUrl(emoji) {
  const code = [...emoji]
    .map(c => c.codePointAt(0))
    .filter(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)
    .map(cp => String.fromCharCode(cp - 0x1F1E6 + 65))
    .join('')
    .toLowerCase()
  return code.length === 2 ? `https://flagcdn.com/w640/${code}.png` : null
}

async function selectTrip(tripId) {
  await store.loadTrip(tripId)
  document.title = store.trip.title
  location.hash = store.trip.id
}
</script>

<template>
  <div v-if="store.trip?.discarded?.length">
    <h2 class="day-header">Sitios descartados</h2>
    <p class="day-subtitle">Sitios investigados pero no incluidos en el plan. Toca para ver en el mapa.</p>

    <div
      v-for="p in store.trip.discarded"
      :key="p.id"
      class="place-card"
      :data-day="'discarded'"
      :data-id="p.id"
      style="border-left-color:var(--text-dim);"
      @click="handleClick(p, $event)"
    >
      <div class="place-name">{{ p.name }}</div>
      <div class="place-desc">{{ p.desc }}</div>
      <div class="place-links">
        <a class="gmaps-link" :href="gmapUrl(p)" target="_blank" @click.stop>📍 Google Maps</a>
        <a v-if="p.link" :href="p.link" target="_blank" @click.stop>🔗 Web</a>
      </div>
      <span class="place-tag descartado">🚫 {{ p.reason }}</span>
    </div>
  </div>
</template>

<script setup>
import { useTripStore } from '../stores/trip.js'
import { buildGmapUrl } from '../composables/useMap.js'

const store = useTripStore()
const emit = defineEmits(['flyTo'])

// El compartido, no una copia local: así respeta `googlePlaceId` y Maps abre el
// sitio exacto en vez de adivinar por el texto del nombre.
function gmapUrl(p) {
  return buildGmapUrl(p, store.trip?.city)
}

function handleClick(p, e) {
  if (e.target.tagName === 'A') return
  emit('flyTo', p.lat, p.lng)
}
</script>

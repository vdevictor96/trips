<template>
  <div v-if="store.trip?.cafes?.length">
    <h2 class="day-header">Cafeterías</h2>
    <p class="day-subtitle">Sitios de café de especialidad (por zonas). Toca para verlo en el mapa.</p>

    <div v-for="group in groups" :key="group.cat" style="margin-bottom:8px;">
      <h3 style="font-size:14px; margin:14px 0 6px; color:var(--text-dim);">{{ group.cat }}</h3>
      <div
        v-for="p in group.items"
        :key="p.id"
        class="place-card"
        :data-day="'cafes'"
        :data-id="p.id"
        style="border-left-color:#8d6e63;"
        :style="{ cursor: p.lat != null ? 'pointer' : 'default' }"
        @click="handleClick(p, $event)"
      >
        <div class="place-name">{{ p.name }}</div>
        <div class="place-desc">{{ p.desc }}</div>
        <div v-if="p.lat != null" class="place-links">
          <a class="gmaps-link" :href="gmapUrl(p)" target="_blank" @click.stop>📍 Google Maps</a>
          <a v-if="p.link" :href="p.link" target="_blank" @click.stop>🔗 Web</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()
const emit = defineEmits(['flyTo'])

const groups = computed(() => {
  const out = []
  for (const p of store.trip?.cafes || []) {
    let g = out.find(x => x.cat === p.cat)
    if (!g) { g = { cat: p.cat || 'Otros', items: [] }; out.push(g) }
    g.items.push(p)
  }
  return out
})

function gmapUrl(p) {
  const city = store.trip?.city
  const q = city ? `${p.name}, ${city}` : p.name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

function handleClick(p, e) {
  if (e.target.tagName === 'A') return
  if (p.lat != null && p.lng != null) emit('flyTo', p.lat, p.lng, p.id)
}
</script>

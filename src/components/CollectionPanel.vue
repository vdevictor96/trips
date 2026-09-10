<template>
  <div v-if="places.length">
    <h2 class="day-header">{{ collection.label }}</h2>
    <p class="day-subtitle">{{ collection.subtitle }}</p>

    <div v-for="group in groups" :key="group.cat" style="margin-bottom:8px;">
      <h3 style="font-size:14px; margin:14px 0 6px; color:var(--text-dim);">{{ group.cat }}</h3>
      <div
        v-for="p in group.items"
        :key="p.id"
        class="place-card"
        :data-day="collection.id"
        :data-id="p.id"
        :style="{ borderLeftColor: collection.color, cursor: p.lat != null ? 'pointer' : 'default' }"
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
import { buildGmapUrl } from '../composables/useMap.js'
import { collectionPlaces } from '../composables/useCollections.js'

const props = defineProps({ collection: { type: Object, required: true } })
const store = useTripStore()
const emit = defineEmits(['flyTo'])

const places = computed(() => collectionPlaces(props.collection, store.trip))

const groups = computed(() => {
  const out = []
  for (const p of places.value) {
    const cat = props.collection.groupBy(p)
    let g = out.find(x => x.cat === cat)
    if (!g) { g = { cat, items: [] }; out.push(g) }
    g.items.push(p)
  }
  return out
})

// El compartido, no una copia local: así respeta `googlePlaceId` y Maps abre el
// sitio exacto en vez de adivinar por el texto del nombre.
function gmapUrl(p) {
  return buildGmapUrl(p, store.trip?.city)
}

function handleClick(p, e) {
  if (e.target.tagName === 'A') return
  if (p.lat != null && p.lng != null) emit('flyTo', p.lat, p.lng, p.id)
}
</script>

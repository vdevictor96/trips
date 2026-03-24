<template>
  <div ref="mapEl" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()
const mapEl = ref(null)
const mapApi = inject('mapApi')
const onMarkerClick = inject('onMarkerClick')

onMounted(async () => {
  await mapApi.initMap(mapEl.value)
  mapApi.buildMarkers(onMarkerClick)
  mapApi.updateVisibleLayers(store.activeDay)
  mapApi.fitBounds(store.activeDay)
})
</script>

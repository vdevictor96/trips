<template>
  <div v-if="routes.length">
    <a
      v-for="route in routes"
      :key="route.label"
      class="directions-btn"
      :href="route.url"
      target="_blank"
    >
      <svg viewBox="0 0 24 24"><path d="M22.43 10.59l-9.01-9.01c-.75-.75-2.07-.76-2.83 0l-9.01 9.01c-.77.76-.77 2.07 0 2.83l9.01 9.01c.38.38.88.57 1.41.57.53 0 1.03-.19 1.41-.57l9.01-9.01c.79-.76.79-2.08.01-2.83zm-7.93.41V14h-3v-2.5H8.5v-3h3V6l4.5 4.5-1.5.5z"/></svg>
      {{ route.label }}
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDirections } from '../composables/useDirections.js'

const props = defineProps({
  places: { type: Array, required: true },
})

const { getDirectionsURLs } = useDirections()

const routes = computed(() => getDirectionsURLs(props.places))
</script>

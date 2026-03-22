<template>
  <div v-if="day">
    <h2 class="day-header">{{ day.title }}</h2>
    <p class="day-subtitle">{{ day.subtitle }}</p>

    <DirectionsButton :places="day.places" />

    <draggable
      v-model="dayPlaces"
      item-key="id"
      handle=".drag-handle"
      ghost-class="place-card-ghost"
      :animation="150"
      group="places"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <PlaceCard
          :place="element"
          :day="day"
          :index="index"
          @fly-to="(lat, lng, id) => emit('flyTo', lat, lng, id)"
          @activate-marker="(id) => emit('activateMarker', id)"
          @show-detail="(place, day) => emit('showDetail', place, day)"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTripStore } from '../stores/trip.js'
import draggable from 'vuedraggable'
import PlaceCard from './PlaceCard.vue'
import DirectionsButton from './DirectionsButton.vue'

const props = defineProps({
  day: { type: Object, default: null },
})

const emit = defineEmits(['flyTo', 'activateMarker', 'showDetail'])
const store = useTripStore()

const dayPlaces = computed({
  get: () => props.day?.places || [],
  set: (newPlaces) => {
    if (props.day) store.reorderPlaces(props.day.id, newPlaces)
  }
})

function onDragEnd() {
  // Reorder is handled by the v-model setter
}
</script>

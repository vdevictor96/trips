<template>
  <div v-if="day">
    <h2 class="day-header">{{ day.title }}</h2>
    <p class="day-subtitle">{{ day.subtitle }}</p>

    <DirectionsButton :places="day.places" :hotel="store.trip?.hotel" :city="store.trip?.city" />

    <draggable
      v-model="dayPlaces"
      item-key="id"
      handle=".drag-handle"
      ghost-class="place-card-ghost"
      :animation="150"
      group="places"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <PlaceCard
          :place="element"
          :day="day"
          :index="index"
          @fly-to="(lat, lng, id) => emit('flyTo', lat, lng, id)"
          @activate-marker="(id) => emit('activateMarker', id)"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useToast } from '../composables/useToast.js'
import draggable from 'vuedraggable'
import PlaceCard from './PlaceCard.vue'
import DirectionsButton from './DirectionsButton.vue'

const props = defineProps({
  day: { type: Object, default: null },
})

const emit = defineEmits(['flyTo', 'activateMarker'])
const store = useTripStore()
const { showUndo } = useToast()
const rebuildMarkers = inject('rebuildMarkers')
const prevOrder = ref(null)

const dayPlaces = computed({
  get: () => props.day?.places || [],
  set: (newPlaces) => {
    if (props.day) store.reorderPlaces(props.day.id, newPlaces)
  }
})

function onDragStart() {
  prevOrder.value = props.day ? [...props.day.places] : null
}

function onDragEnd() {
  if (!prevOrder.value || !props.day) return
  const saved = [...prevOrder.value]
  const dayId = props.day.id
  rebuildMarkers?.()
  showUndo('Orden actualizado', () => {
    store.reorderPlaces(dayId, saved)
    rebuildMarkers?.()
  })
  prevOrder.value = null
}
</script>

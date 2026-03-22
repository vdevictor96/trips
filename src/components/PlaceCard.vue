<template>
  <div
    class="place-card"
    :data-day="day.id"
    :data-id="place.id"
    :data-lat="place.lat"
    :data-lng="place.lng"
    :style="{ borderLeftColor: day.color }"
    @click="handleClick"
  >
    <div class="place-card-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="flex:1; min-width:0;">
        <div class="place-time" :style="{ color: day.color }">{{ place.time }} · {{ place.dur }}</div>
        <div class="place-name">
          <span class="place-number" :style="{ background: day.color }"><span>{{ index + 1 }}</span></span>
          {{ place.name }}
        </div>
      </div>
      <div style="display:flex; gap:4px; align-items:center; flex-shrink:0; margin-left:8px;">
        <button class="edit-btn" @click.stop="showMoveMenu = !showMoveMenu" title="Mover a otro día">↗</button>
        <button class="edit-btn" @click.stop="editing = !editing" :title="editing ? 'Cerrar' : 'Editar'">
          {{ editing ? '✕' : '✎' }}
        </button>
        <span class="drag-handle">≡</span>
      </div>
    </div>

    <!-- Move to day selector -->
    <div v-if="showMoveMenu" class="move-menu" @click.stop>
      <span class="move-label">Mover a:</span>
      <button
        v-for="d in otherDays"
        :key="d.id"
        class="move-day-pill"
        :style="{ background: d.color, color: '#111' }"
        @click="handleMove(d.id)"
      >
        Día {{ d.id }}
      </button>
      <button class="move-day-pill cancel" @click="showMoveMenu = false">✕</button>
    </div>

    <div class="place-desc">{{ place.desc }}</div>
    <div class="place-links">
      <a class="gmaps-link" :href="gmapUrl" target="_blank" @click.stop>📍 Google Maps</a>
      <a v-if="place.link" :href="place.link" target="_blank" @click.stop>🔗 Web</a>
    </div>
    <span v-for="tag in place.tags" :key="tag" class="place-tag" :class="tag">
      {{ tagLabels[tag] || tag }}
    </span>

    <!-- Inline editor -->
    <PlaceEditor
      v-if="editing"
      :place="place"
      :day="day"
      @save="handleSave"
      @cancel="editing = false"
      @remove="handleRemove"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useToast } from '../composables/useToast.js'
import PlaceEditor from './PlaceEditor.vue'

const props = defineProps({
  place: { type: Object, required: true },
  day: { type: Object, required: true },
  index: { type: Number, required: true },
})

const emit = defineEmits(['flyTo', 'activateMarker', 'showDetail'])
const store = useTripStore()
const { showUndo } = useToast()
const editing = ref(false)
const showMoveMenu = ref(false)

const otherDays = computed(() =>
  store.trip?.days.filter(d => d.id !== props.day.id) || []
)

function handleMove(targetDayId) {
  const fromDayId = props.day.id
  const fromIndex = props.index
  const targetDay = store.trip.days.find(d => d.id === targetDayId)
  const movedPlace = { ...props.place }
  store.movePlace(fromDayId, targetDayId, fromIndex, targetDay.places.length)
  showMoveMenu.value = false
  showUndo(`"${movedPlace.name}" → Día ${targetDayId}`, () => {
    const newDay = store.trip.days.find(d => d.id === targetDayId)
    const newIdx = newDay.places.findIndex(p => p.lat === movedPlace.lat && p.lng === movedPlace.lng)
    if (newIdx !== -1) {
      store.movePlace(targetDayId, fromDayId, newIdx, Math.min(fromIndex, store.trip.days.find(d => d.id === fromDayId).places.length))
    }
  })
}

const tagLabels = {
  obligatorio: '⭐ Obligatorio',
  gratis: '🆓 Gratis',
  reservar: '📞 Reservar',
  mirador: '🌅 Mirador',
}

const gmapUrl = computed(() =>
  `https://www.google.com/maps/search/?api=1&query=${props.place.lat},${props.place.lng}`
)

function handleClick(e) {
  if (e.target.tagName === 'A' || e.target.closest('.edit-btn') || e.target.closest('.place-editor') || e.target.closest('.drag-handle') || e.target.closest('.move-menu') || editing.value || showMoveMenu.value) return
  emit('flyTo', props.place.lat, props.place.lng, props.place.id)
  emit('activateMarker', props.place.id)
  emit('showDetail', props.place, props.day)
}

function handleSave(updates) {
  store.updatePlace(props.day.id, props.place.id, updates)
  editing.value = false
}

function handleRemove() {
  const removedPlace = { ...props.place }
  const dayId = props.day.id
  const index = props.index
  store.removePlace(dayId, props.place.id)
  editing.value = false
  showUndo(`"${removedPlace.name}" eliminado`, () => {
    // Restore at the same position
    const day = store.trip.days.find(d => d.id === dayId)
    if (day) {
      day.places.splice(index, 0, removedPlace)
      store.reorderPlaces(dayId, [...day.places])
    }
  })
}
</script>

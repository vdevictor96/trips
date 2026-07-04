<template>
  <div
    ref="tabsEl"
    class="day-tabs"
    :class="{ dragging }"
    @pointerdown="onPointerDown"
    @click.capture="onClickCapture"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="day-tab"
      :class="{ active: store.activeDay === tab.id }"
      :data-day="tab.id"
      :style="tabActiveStyle(tab)"
      @click="emit('selectDay', tab.id)"
    >
      {{ tab.label }}
      <span
        v-if="tab.id === 'restaurants'"
        class="rest-eye"
        :class="{ on: store.showRestaurants }"
        role="button"
        :aria-pressed="store.showRestaurants"
        :aria-label="store.showRestaurants ? 'Ocultar restaurantes del mapa' : 'Mostrar restaurantes junto a cada día'"
        :title="store.showRestaurants ? 'Ocultar restaurantes del mapa' : 'Mostrar restaurantes junto a cada día'"
        @click.stop="emit('toggleRestaurants')"
      >👁</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()
const emit = defineEmits(['selectDay', 'toggleRestaurants'])

// Arrastrar con el ratón para hacer scroll horizontal en laptop (el táctil ya
// usa el scroll nativo; solo interceptamos el puntero de ratón).
const tabsEl = ref(null)
const dragging = ref(false)
let moved = false
let startX = 0
let startScroll = 0

function onPointerDown(e) {
  if (e.pointerType !== 'mouse') return
  dragging.value = true
  moved = false
  startX = e.clientX
  startScroll = tabsEl.value.scrollLeft
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
function onPointerMove(e) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 4) moved = true
  tabsEl.value.scrollLeft = startScroll - dx
}
function onPointerUp() {
  dragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}
// Si el gesto fue un arrastre, cancela el click para no cambiar de día sin querer.
function onClickCapture(e) {
  if (moved) { e.stopPropagation(); e.preventDefault(); moved = false }
}
onBeforeUnmount(onPointerUp)

const tabs = computed(() => {
  if (!store.trip) return []
  const t = store.trip.days.map(d => ({ id: d.id, label: d.tab, color: d.color }))
  t.push({ id: 'info', label: 'ℹ️ Info útil', color: null })
  if (store.trip.restaurants?.length) {
    t.push({ id: 'restaurants', label: '🍴 Restauración', color: null })
  }
  if (store.trip.cafes?.length) {
    t.push({ id: 'cafes', label: '☕ Cafeterías', color: null })
  }
  if (store.trip.discarded?.length) {
    t.push({ id: 'discarded', label: '🗑️ Descartados', color: null })
  }
  if (store.trip.notes?.length || true) {
    t.push({ id: 'notes', label: '📝 Notas', color: null })
  }
  return t
})

function tabActiveStyle(tab) {
  if (store.activeDay !== tab.id || !tab.color) return {}
  return {
    background: tab.color,
    borderColor: tab.color,
    color: 'var(--bg)'
  }
}
</script>

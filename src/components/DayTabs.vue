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
        v-if="tab.collection"
        class="rest-eye"
        :class="{ on: store.overlays[tab.id] }"
        role="button"
        :aria-pressed="store.overlays[tab.id]"
        :aria-label="overlayLabel(tab)"
        :title="overlayLabel(tab)"
        @click.stop="emit('toggleOverlay', tab.id)"
      >👁</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, onMounted, watch, nextTick } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { COLLECTIONS, collectionPlaces } from '../composables/useCollections.js'

const store = useTripStore()
const emit = defineEmits(['selectDay', 'toggleOverlay'])

// Centra la pastilla activa en la fila con scroll horizontal (p. ej. al abrir
// en el día actual, que puede quedar fuera de vista si es el día 3+).
function scrollActiveIntoView(smooth = true) {
  const container = tabsEl.value
  if (!container) return
  const el = container.querySelector('.day-tab.active')
  if (!el) return
  const cRect = container.getBoundingClientRect()
  const eRect = el.getBoundingClientRect()
  const delta = (eRect.left - cRect.left) - (container.clientWidth - el.clientWidth) / 2
  container.scrollBy({ left: delta, behavior: smooth ? 'smooth' : 'auto' })
}

onMounted(() => nextTick(() => scrollActiveIntoView(false)))
// Reaccionar a cambios del día activo (carga inicial / deep link / navegación)
watch(() => store.activeDay, () => nextTick(() => scrollActiveIntoView()))

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
  const t = store.trip.days
    .filter(d => !d.wildcard)
    .map(d => ({ id: d.id, label: d.tab, color: d.color }))
  // Pastilla comodín "Pendientes", justo tras los días normales
  const pending = store.trip.days.find(d => d.wildcard)
  if (pending) t.push({ id: pending.id, label: pending.tab, color: pending.color })
  t.push({ id: 'info', label: 'ℹ️ Info útil', color: null })
  for (const c of COLLECTIONS) {
    if (collectionPlaces(c, store.trip).length) {
      t.push({ id: c.id, label: `${c.emoji} ${c.label}`, color: null, collection: c })
    }
  }
  if (store.trip.discarded?.length) {
    t.push({ id: 'discarded', label: '🗑️ Descartados', color: null })
  }
  if (store.trip.notes?.length || true) {
    t.push({ id: 'notes', label: '📝 Notas', color: null })
  }
  return t
})

function overlayLabel(tab) {
  const n = tab.collection.label.toLowerCase()
  return store.overlays[tab.id] ? `Ocultar ${n} del mapa` : `Mostrar ${n} junto a cada día`
}

function tabActiveStyle(tab) {
  if (store.activeDay !== tab.id || !tab.color) return {}
  return {
    background: tab.color,
    borderColor: tab.color,
    color: 'var(--bg)'
  }
}
</script>

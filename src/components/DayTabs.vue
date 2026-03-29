<template>
  <div class="day-tabs">
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
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()
const emit = defineEmits(['selectDay'])

const tabs = computed(() => {
  if (!store.trip) return []
  const t = store.trip.days.map(d => ({ id: d.id, label: d.tab, color: d.color }))
  t.push({ id: 'info', label: 'ℹ️ Info útil', color: null })
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

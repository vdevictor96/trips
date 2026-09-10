<template>
  <div>
    <h2 class="day-header">Vista general</h2>
    <p class="day-subtitle">Todos los días del viaje. Toca un día para ver detalles.</p>

    <div
      v-for="d in normalDays"
      :key="d.id"
      class="place-card overview-card"
      :style="{ borderLeftColor: d.color, cursor: 'pointer' }"
      @click="emit('navigate', d.id)"
    >
      <div class="place-time" :style="{ color: d.color }">Día {{ d.id }} · {{ d.places.length }} sitios</div>
      <div class="place-name">{{ d.title }}</div>
      <div class="place-desc" style="color:var(--text-dim)">{{ d.subtitle }}</div>
    </div>

    <div
      v-if="pendingDay"
      class="place-card overview-card"
      :style="{ borderLeftColor: pendingDay.color, cursor: 'pointer' }"
      @click="emit('navigate', pendingDay.id)"
    >
      <div class="place-time" :style="{ color: pendingDay.color }">🃏 Pendientes · {{ pendingDay.places.length }} sitios</div>
      <div class="place-name">Comodín: lo que no dio tiempo</div>
      <div class="place-desc" style="color:var(--text-dim)">Añade aquí planes sueltos y muévelos a un día cuando encuentres hueco.</div>
    </div>

    <div
      class="place-card overview-card"
      style="border-left-color:var(--blue); cursor:pointer;"
      @click="emit('navigate', 'info')"
    >
      <div class="place-time" style="color:var(--blue)">ℹ️ Info útil</div>
      <div class="place-name">Transporte, reservas, por resolver</div>
    </div>

    <div
      v-for="c in collectionCards"
      :key="c.id"
      class="place-card overview-card"
      :style="{ borderLeftColor: c.color, cursor: 'pointer' }"
      @click="emit('navigate', c.id)"
    >
      <div class="place-time" :style="{ color: c.color }">{{ c.emoji }} {{ c.label }} · {{ c.count }} {{ c.countLabel }}</div>
      <div class="place-name">{{ c.blurb }}</div>
    </div>

    <div
      v-if="store.trip.discarded?.length"
      class="place-card overview-card"
      style="border-left-color:var(--text-dim); cursor:pointer;"
      @click="emit('navigate', 'discarded')"
    >
      <div class="place-time" style="color:var(--text-dim)">🗑️ Descartados · {{ store.trip.discarded.length }} sitios</div>
      <div class="place-name">Sitios investigados pero no incluidos</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { COLLECTIONS, collectionPlaces } from '../composables/useCollections.js'

const store = useTripStore()
const emit = defineEmits(['navigate'])

const normalDays = computed(() => store.trip.days.filter(d => !d.wildcard))
const pendingDay = computed(() => store.trip.days.find(d => d.wildcard))

const collectionCards = computed(() =>
  COLLECTIONS
    .map(c => ({ ...c, count: collectionPlaces(c, store.trip).length }))
    .filter(c => c.count > 0)
)
</script>

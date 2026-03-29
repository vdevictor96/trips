<template>
  <div>
    <h2 class="day-header">Vista general</h2>
    <p class="day-subtitle">Todos los días del viaje. Toca un día para ver detalles.</p>

    <div
      v-for="d in store.trip.days"
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
      class="place-card overview-card"
      style="border-left-color:var(--blue); cursor:pointer;"
      @click="emit('navigate', 'info')"
    >
      <div class="place-time" style="color:var(--blue)">ℹ️ Info útil</div>
      <div class="place-name">Transporte, comida, reservas</div>
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
import { useTripStore } from '../stores/trip.js'

const store = useTripStore()
const emit = defineEmits(['navigate'])
</script>

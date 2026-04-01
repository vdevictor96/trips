<template>
  <div v-if="store.trip">
    <h2 class="day-header">Info práctica</h2>
    <p class="day-subtitle">Transporte, comida, reservas</p>

    <InfoSection
      title="🚌 Transporte"
      section="transport"
      separator=":"
    />

    <InfoSection
      title="📞 Reservas pendientes"
      section="reservas"
      separator=":"
    />

    <InfoSection
      title="🍽️ Comida típica a probar"
      section="food"
      separator=" —"
    />

    <div class="info-section">
      <h3>📅 Resumen de días</h3>
      <div v-for="d in store.trip.days" :key="d.id" class="info-item">
        <strong :style="{ color: d.color }">Día {{ d.id }}:</strong> {{ d.title }}<br>
        <span style="color:var(--text-dim); font-size:12px">{{ d.subtitle }}</span>
      </div>
    </div>

    <!-- Persistence controls -->
    <div class="info-section" style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border);">
      <h3>💾 Datos del viaje</h3>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <button class="editor-btn save" @click="store.exportTrip()" style="font-size:12px; padding:6px 12px;">
          Exportar JSON
        </button>
        <button class="editor-btn cancel" @click="showResetModal = true" style="font-size:12px; padding:6px 12px;">
          Resetear a original
        </button>
      </div>
    </div>

    <ConfirmModal
      :show="showResetModal"
      title="Resetear itinerario"
      message="Se perderán todos los cambios de orden, ediciones y notas. El itinerario volverá al estado original de diseño."
      confirm-text="Resetear todo"
      :danger="true"
      @confirm="doReset"
      @cancel="showResetModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTripStore } from '../stores/trip.js'
import ConfirmModal from './ConfirmModal.vue'
import InfoSection from './InfoSection.vue'

const store = useTripStore()
const showResetModal = ref(false)

async function doReset() {
  showResetModal.value = false
  await store.resetToOriginal()
}
</script>

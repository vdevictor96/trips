<template>
  <div v-if="store.trip">
    <h2 class="day-header">Info práctica</h2>
    <p class="day-subtitle">Por resolver, transporte, reservas, temporada, comida y avisos</p>

    <template v-for="s in INFO_SECTIONS" :key="s.section">
      <InfoSection
        v-if="s.always || store.trip.info[s.section]?.length"
        :title="s.title"
        :section="s.section"
        :separator="s.separator"
      />
    </template>

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

// The `info` keys a trip JSON can fill, in display order. `always` sections show
// even when empty (they carry the "+ Añadir" button); the rest only if the trip has them.
const INFO_SECTIONS = [
  { section: 'pendientes', title: '🔧 Por resolver (feedback)', separator: ' —' },
  { section: 'transport', title: '🚌 Transporte', separator: ':', always: true },
  { section: 'mundial', title: '⚽ Mundial 2026 (durante el viaje)', separator: ' —' },
  { section: 'reservas', title: '📞 Reservas pendientes', separator: ':', always: true },
  { section: 'temporada', title: '🎄 Planes de la temporada', separator: ':' },
  { section: 'food', title: '🥟 Qué comer', separator: ':' },
  { section: 'avisos', title: '⚠️ Avisos', separator: ':' },
]

async function doReset() {
  showResetModal.value = false
  await store.resetToOriginal()
}
</script>

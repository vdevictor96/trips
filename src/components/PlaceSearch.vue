<template>
  <div class="search-container">
    <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    <input
      ref="inputEl"
      type="text"
      class="search-input"
      :placeholder="mode === 'google' ? 'Buscar en Google Maps...' : 'Buscar sitio...'"
      autocomplete="off"
      v-model="query"
      @input="onInput"
    />

    <!-- Mode toggle -->
    <div v-if="googleAvailable" class="search-mode-toggle">
      <button :class="{ active: mode === 'local' }" @click="setMode('local')">Mis sitios</button>
      <button :class="{ active: mode === 'google' }" @click="setMode('google')">Google</button>
    </div>

    <!-- Results dropdown -->
    <div class="search-results" :class="{ visible: showResults }">
      <!-- Local mode results -->
      <template v-if="mode === 'local'">
        <div
          v-for="match in localMatches"
          :key="match.id"
          class="search-result-item"
          @click="selectLocalResult(match)"
        >
          {{ match.name }}
          <span class="search-result-day" :style="{ color: match.dayColor }">
            {{ match.dayId === 'discarded' ? 'Descartados' : 'Día ' + match.dayId }}
          </span>
        </div>
        <div v-if="query && !localMatches.length" class="search-result-item" style="color:var(--text-dim)">
          Sin resultados
        </div>
      </template>

      <!-- Google mode results -->
      <template v-if="mode === 'google'">
        <div v-if="googleLoading" class="search-result-item" style="color:var(--text-dim)">
          Buscando...
        </div>
        <div
          v-for="result in googleResults"
          :key="result.googlePlaceId"
          class="search-result-item google-result"
        >
          <div class="google-result-info" @click="showAddMenu(result)">
            <div class="google-result-name">
              {{ result.name }}
              <span v-if="isAlreadyInTrip(result)" class="google-result-badge">Ya añadido</span>
            </div>
            <div class="google-result-meta">
              <span v-if="result.rating" class="google-result-rating">
                <span class="star">★</span> {{ result.rating.toFixed(1) }}
                <span v-if="result.ratingCount" style="opacity:.6">({{ result.ratingCount }})</span>
              </span>
              <span class="google-result-address">{{ result.address }}</span>
            </div>
          </div>
          <!-- Day picker for adding -->
          <div v-if="addingPlace === result.googlePlaceId && !isAlreadyInTrip(result)" class="google-result-add">
            <select v-model="selectedDayId" class="day-select">
              <option v-for="d in store.trip.days" :key="d.id" :value="d.id">Día {{ d.id }}</option>
            </select>
            <button class="add-btn" @click="addGooglePlace(result)">+ Añadir</button>
          </div>
        </div>
        <div v-if="!googleLoading && query && !googleResults.length && googleSearched" class="search-result-item" style="color:var(--text-dim)">
          Sin resultados en Google
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useGooglePlaces } from '../composables/useGooglePlaces.js'
import { useToast } from '../composables/useToast.js'

const store = useTripStore()
const { isAvailable, searchPlaces } = useGooglePlaces()
const { show } = useToast()
const mapApi = inject('mapApi')
const emit = defineEmits(['selectPlace', 'flyTo'])

const query = ref('')
const showResults = ref(false)
const inputEl = ref(null)
const mode = ref('local')
const googleResults = ref([])
const googleLoading = ref(false)
const googleSearched = ref(false)
const addingPlace = ref(null)
const selectedDayId = ref(null)

const googleAvailable = isAvailable()

let debounceTimer = null

const localMatches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return store.allPlaces.filter(p => p.name.toLowerCase().includes(q))
})

function setMode(m) {
  mode.value = m
  googleResults.value = []
  googleSearched.value = false
  mapApi?.clearSearchMarkers()
  if (query.value.trim()) onInput()
}

function onInput() {
  const q = query.value.trim()
  showResults.value = q.length > 0

  if (mode.value === 'google' && q.length >= 2) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => searchGoogle(q), 300)
  }
}

async function searchGoogle(q) {
  if (!store.trip) return
  googleLoading.value = true
  googleSearched.value = false
  const [lat, lng] = store.trip.mapCenter
  googleResults.value = await searchPlaces(q, lat, lng)
  googleLoading.value = false
  googleSearched.value = true
  // Show search pins on map
  if (googleResults.value.length) mapApi?.showSearchMarkers(googleResults.value)
}

function isAlreadyInTrip(result) {
  // Check by googlePlaceId or by proximity (within ~100m)
  return store.allPlaces.some(p => {
    if (p.googlePlaceId && p.googlePlaceId === result.googlePlaceId) return true
    const dlat = Math.abs(p.lat - result.lat)
    const dlng = Math.abs(p.lng - result.lng)
    return dlat < 0.001 && dlng < 0.001
  })
}

function showAddMenu(result) {
  if (isAlreadyInTrip(result)) return
  addingPlace.value = addingPlace.value === result.googlePlaceId ? null : result.googlePlaceId
  if (!selectedDayId.value && store.trip?.days.length) {
    selectedDayId.value = store.activeDay && typeof store.activeDay === 'number'
      ? store.activeDay
      : store.trip.days[0].id
  }
}

function addGooglePlace(result) {
  const place = {
    name: result.name,
    lat: result.lat,
    lng: result.lng,
    desc: result.editorial || result.address,
    time: '',
    dur: '',
    tags: [],
    link: '',
    googlePlaceId: result.googlePlaceId,
  }
  store.addPlace(selectedDayId.value, place)
  show(`${result.name} añadido a Día ${selectedDayId.value}`)
  emit('flyTo', result.lat, result.lng)

  query.value = ''
  showResults.value = false
  addingPlace.value = null
  googleResults.value = []
  mapApi?.clearSearchMarkers()
}

function selectLocalResult(match) {
  emit('selectPlace', match)
  query.value = ''
  showResults.value = false
}

function onOutsideClick(e) {
  if (!e.target.closest('.search-container')) {
    showResults.value = false
    addingPlace.value = null
    mapApi?.clearSearchMarkers()
  }
}

onMounted(() => document.addEventListener('click', onOutsideClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick)
  clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search-mode-toggle {
  display: flex;
  gap: 0;
  margin: 6px 0 0;
}
.search-mode-toggle button {
  flex: 1;
  padding: 6px 12px;
  border: 1.5px solid #333;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all .15s;
}
.search-mode-toggle button:first-child {
  border-radius: 8px 0 0 8px;
  border-right: none;
}
.search-mode-toggle button:last-child {
  border-radius: 0 8px 8px 0;
}
.search-mode-toggle button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #111;
}

.google-result {
  padding: 8px 14px;
}
.google-result-info {
  cursor: pointer;
}
.google-result-name {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.google-result-badge {
  font-size: 10px;
  font-weight: 700;
  background: rgba(38,222,129,.2);
  color: #26de81;
  padding: 2px 6px;
  border-radius: 4px;
}
.google-result-meta {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 2px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.google-result-rating .star {
  color: #f7b731;
}
.google-result-address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.google-result-add {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  align-items: center;
}
.day-select {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1.5px solid #444;
  background: var(--bg);
  color: var(--text);
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
}
.add-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: var(--accent);
  color: #111;
  font-size: 12px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  white-space: nowrap;
}
.add-btn:active { transform: scale(.97); }
</style>

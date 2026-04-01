import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSync } from '../composables/useSync.js'

const DEFAULT_COLORS = ['#f7b731','#26de81','#fc5c65','#a55eea','#4b7bec','#fd9644','#2bcbba','#eb3b5a']

export const useTripStore = defineStore('trip', () => {
  // State
  const trip = ref(null)
  const activeDay = ref(null)
  const activeMarkerId = ref(null)
  const tripsIndex = ref([])
  const { initSync, pushEdits, fetchRemote, stopSync, syncing } = useSync()

  // Computed
  const currentDay = computed(() => {
    if (!trip.value || activeDay.value === null) return null
    return trip.value.days.find(d => d.id === activeDay.value) || null
  })

  const allPlaces = computed(() => {
    if (!trip.value) return []
    const places = trip.value.days.flatMap(d =>
      d.places.map(p => ({ ...p, dayId: d.id, dayTab: d.tab, dayColor: d.color }))
    )
    if (trip.value.discarded?.length) {
      places.push(...trip.value.discarded.map(p => ({
        ...p, dayId: 'discarded', dayTab: 'Descartados', dayColor: '#666'
      })))
    }
    return places
  })

  // Persistence helpers
  function getEditsKey(tripId) {
    return `trip-edits:${tripId}`
  }

  function loadEdits(tripId) {
    try {
      const raw = localStorage.getItem(getEditsKey(tripId))
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  function saveEdits() {
    if (!trip.value) return
    const data = JSON.stringify(trip.value)
    localStorage.setItem(getEditsKey(trip.value.id), data)
  }

  let saveTimeout = null
  function debouncedSave() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveEdits()
      if (trip.value) pushEdits(trip.value.id, trip.value)
    }, 500)
  }

  function hasLocalEdits(tripId) {
    return localStorage.getItem(getEditsKey(tripId)) !== null
  }

  function clearEdits(tripId) {
    localStorage.removeItem(getEditsKey(tripId || trip.value?.id))
  }

  function exportTrip() {
    if (!trip.value) return
    const blob = new Blob([JSON.stringify(trip.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trip.value.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Actions
  async function fetchTripsIndex() {
    const res = await fetch(`${import.meta.env.BASE_URL}trips/index.json`)
    tripsIndex.value = (await res.json()).trips
  }

  function _applyDefaults(data) {
    const colors = data.dayColors || DEFAULT_COLORS
    data.days.forEach((d, i) => { d.color = colors[i % colors.length] })
    if (!data.notes) data.notes = []
    // Migrate old text-only notes to new { title, desc, link } model
    data.notes.forEach(n => {
      if (n.text !== undefined && n.title === undefined) {
        n.title = n.text
        n.desc = ''
        n.link = ''
        delete n.text
      }
    })
    return data
  }

  async function loadTrip(tripId) {
    // Priority: Firebase → localStorage → static JSON
    const remote = await fetchRemote(tripId)
    if (remote) {
      trip.value = _applyDefaults(remote)
    } else {
      const edits = loadEdits(tripId)
      if (edits) {
        trip.value = _applyDefaults(edits)
      } else {
        const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`)
        trip.value = _applyDefaults(await res.json())
      }
    }

    activeDay.value = trip.value.days[0]?.id ?? null
    activeMarkerId.value = null

    // Start real-time sync listener
    initSync(tripId, (remoteData) => {
      if (!trip.value) return
      _applyDefaults(remoteData)
      trip.value = remoteData
      saveEdits() // cache locally too
    })
  }

  function unloadTrip() {
    stopSync()
    trip.value = null
    activeDay.value = null
    activeMarkerId.value = null
  }

  function setActiveDay(dayId) {
    activeDay.value = dayId
    activeMarkerId.value = null
  }

  function setActiveMarker(markerId) {
    activeMarkerId.value = markerId
  }

  function updatePlace(dayId, placeId, updates) {
    const day = trip.value.days.find(d => d.id === dayId)
    if (!day) return
    const place = day.places.find(p => p.id === placeId)
    if (!place) return
    Object.assign(place, updates)
    debouncedSave()
  }

  function addPlace(dayId, place) {
    const day = trip.value.days.find(d => d.id === dayId)
    if (!day) return
    const idx = day.places.length + 1
    place.id = `${dayId}.${idx}`
    day.places.push(place)
    _renumberPlaces(day)
    debouncedSave()
  }

  function removePlace(dayId, placeId) {
    const day = trip.value.days.find(d => d.id === dayId)
    if (!day) return
    const idx = day.places.findIndex(p => p.id === placeId)
    if (idx === -1) return
    day.places.splice(idx, 1)
    _renumberPlaces(day)
    debouncedSave()
  }

  function movePlace(fromDayId, toDayId, fromIndex, toIndex) {
    const fromDay = trip.value.days.find(d => d.id === fromDayId)
    const toDay = trip.value.days.find(d => d.id === toDayId)
    if (!fromDay || !toDay) return
    const [place] = fromDay.places.splice(fromIndex, 1)
    toDay.places.splice(toIndex, 0, place)
    _renumberPlaces(fromDay)
    if (fromDayId !== toDayId) _renumberPlaces(toDay)
    debouncedSave()
  }

  function reorderPlaces(dayId, newPlaces) {
    const day = trip.value.days.find(d => d.id === dayId)
    if (!day) return
    day.places = newPlaces
    _renumberPlaces(day)
    debouncedSave()
  }

  function _renumberPlaces(day) {
    day.places.forEach((p, i) => { p.id = `${day.id}.${i + 1}` })
  }

  function updateDay(dayId, updates) {
    const day = trip.value.days.find(d => d.id === dayId)
    if (!day) return
    Object.assign(day, updates)
    debouncedSave()
  }

  // Notes
  function addNote(title = '') {
    if (!trip.value.notes) trip.value.notes = []
    const id = `n.${Date.now()}`
    trip.value.notes.push({ id, title, desc: '', link: '', created: new Date().toISOString().slice(0, 10) })
    debouncedSave()
    return id
  }

  function updateNote(noteId, updates) {
    const note = trip.value.notes?.find(n => n.id === noteId)
    if (!note) return
    Object.assign(note, updates)
    debouncedSave()
  }

  function removeNote(noteId) {
    if (!trip.value.notes) return
    const idx = trip.value.notes.findIndex(n => n.id === noteId)
    if (idx !== -1) trip.value.notes.splice(idx, 1)
    debouncedSave()
  }

  function reorderNotes(newNotes) {
    trip.value.notes = newNotes
    debouncedSave()
  }

  // Info items (transport, food, reservas)
  function addInfoItem(section, item = { label: '', value: '' }) {
    if (!trip.value.info) trip.value.info = {}
    if (!trip.value.info[section]) trip.value.info[section] = []
    trip.value.info[section].push({ ...item })
    debouncedSave()
    return trip.value.info[section].length - 1
  }

  function updateInfoItem(section, index, updates) {
    if (!trip.value.info?.[section]?.[index]) return
    Object.assign(trip.value.info[section][index], updates)
    debouncedSave()
  }

  function removeInfoItem(section, index) {
    if (!trip.value.info?.[section]) return
    trip.value.info[section].splice(index, 1)
    debouncedSave()
  }

  async function resetToOriginal() {
    if (!trip.value) return
    const tripId = trip.value.id
    clearEdits(tripId)
    const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`)
    trip.value = _applyDefaults(await res.json())
    activeDay.value = trip.value.days[0]?.id ?? null
    pushEdits(tripId, trip.value)
  }

  return {
    // State
    trip,
    activeDay,
    activeMarkerId,
    tripsIndex,
    // Computed
    currentDay,
    allPlaces,
    // Actions
    fetchTripsIndex,
    loadTrip,
    unloadTrip,
    setActiveDay,
    setActiveMarker,
    updatePlace,
    addPlace,
    removePlace,
    movePlace,
    reorderPlaces,
    updateDay,
    addNote,
    updateNote,
    removeNote,
    reorderNotes,
    hasLocalEdits,
    clearEdits,
    resetToOriginal,
    exportTrip,
    addInfoItem,
    updateInfoItem,
    removeInfoItem,
  }
})

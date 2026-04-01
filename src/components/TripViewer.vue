<template>
  <div class="app-viewer">
    <MapView ref="mapViewRef" />
    <button class="back-btn" @click="$emit('back')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      VIAJES
    </button>
    <BottomSheet ref="sheetRef">
      <template #search>
        <PlaceSearch @select-place="handlePlaceSelect" @fly-to="handleFlyTo" @preview-search-result="handlePreviewSearchResult" />
      </template>
      <template #tabs>
        <DayTabs @select-day="handleDaySelect" />
      </template>
      <template #body>
        <OverviewPanel v-if="store.activeDay === null" @navigate="handleDaySelect" />
        <InfoPanel v-else-if="store.activeDay === 'info'" />
        <DiscardedPanel v-else-if="store.activeDay === 'discarded'" @fly-to="handleFlyTo" />
        <NotesPanel v-else-if="store.activeDay === 'notes'" />
        <DayContent
          v-else
          :day="store.currentDay"
          @fly-to="handleFlyTo"
          @activate-marker="handleActivateMarker"
        />
      </template>
    </BottomSheet>

    <!-- Toast notifications -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, nextTick, provide } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useMap } from '../composables/useMap.js'
import MapView from './MapView.vue'
import BottomSheet from './BottomSheet.vue'
import PlaceSearch from './PlaceSearch.vue'
import DayTabs from './DayTabs.vue'
import OverviewPanel from './OverviewPanel.vue'
import InfoPanel from './InfoPanel.vue'
import DiscardedPanel from './DiscardedPanel.vue'
import NotesPanel from './NotesPanel.vue'
import DayContent from './DayContent.vue'
import ToastNotification from './ToastNotification.vue'
import { useToast } from '../composables/useToast.js'
import { useGooglePlaces } from '../composables/useGooglePlaces.js'

const emit = defineEmits(['back'])

const store = useTripStore()
const { show } = useToast()
const { getPlaceDetails } = useGooglePlaces()
const mapViewRef = ref(null)
const sheetRef = ref(null)

// Provide map functions to children
const mapApi = useMap()
provide('mapApi', mapApi)

function handleDaySelect(dayId) {
  if (dayId === store.activeDay) {
    store.setActiveDay(null) // toggle to overview
  } else {
    store.setActiveDay(dayId)
  }
  mapApi.updateVisibleLayers(store.activeDay)
  mapApi.fitBounds(store.activeDay)
  sheetRef.value?.expand()
}

function handlePlaceSelect(place) {
  const dayId = typeof place.dayId === 'string' ? place.dayId : parseInt(place.dayId)
  if (dayId !== store.activeDay) {
    store.setActiveDay(dayId === 'discarded' ? 'discarded' : dayId)
    mapApi.updateVisibleLayers(store.activeDay)
  }
  mapApi.flyTo(place.lat, place.lng)
  mapApi.activateMarker(place.id)
  sheetRef.value?.expand()

  nextTick(() => {
    setTimeout(() => {
      const card = document.querySelector(`.place-card[data-id="${place.id}"]`)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('highlight')
        setTimeout(() => card.classList.remove('highlight'), 2000)
      }
    }, 400)
  })
}

function handleFlyTo(lat, lng, placeId) {
  mapApi.flyTo(lat, lng)
  if (placeId) mapApi.activateMarker(placeId)
  sheetRef.value?.collapse()
}

function handleActivateMarker(placeId) {
  mapApi.activateMarker(placeId)
}

function handlePreviewSearchResult(result) {
  sheetRef.value?.collapse()
  mapApi.flyTo(result.lat, result.lng, 16)
  mapApi.openSearchResultInfoWindow(result, store.trip.days, (dayId) => {
    const place = {
      name: result.name,
      lat: result.lat, lng: result.lng,
      desc: result.editorial || result.address,
      time: '', dur: '', tags: [], link: '',
      googlePlaceId: result.googlePlaceId,
    }
    store.addPlace(dayId, place)
    show(`${result.name} añadido a Día ${dayId}`)
    mapApi.clearSearchMarkers()
    rebuildMarkers()
  })
}

// Marker click handler
function onMarkerClick(dayId, placeId) {
  if (store.activeDay !== dayId) {
    store.setActiveDay(dayId)
    mapApi.updateVisibleLayers(dayId)
  }
  // Open popup and highlight card — sheet stays as-is so map is visible
  mapApi.activateMarker(placeId)
  mapApi.openPopup(placeId)

  nextTick(() => {
    setTimeout(() => {
      const card = document.querySelector(`.place-card[data-id="${placeId}"]`)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('highlight')
        setTimeout(() => card.classList.remove('highlight'), 2000)
      }
    }, 350)
  })
}

provide('onMarkerClick', onMarkerClick)

function rebuildMarkers() {
  mapApi.buildMarkers(onMarkerClick)
  mapApi.updateVisibleLayers(store.activeDay)
}
provide('rebuildMarkers', rebuildMarkers)

// Handle native Google Maps POI clicks — show add-to-day form
mapApi.onPoiClick(async (googlePlaceId, latLng) => {
  const details = await getPlaceDetails(googlePlaceId)
  const result = details
    ? { name: details.name, lat: details.lat || latLng.lat, lng: details.lng || latLng.lng, address: details.address, rating: details.rating, ratingCount: details.ratingCount, editorial: details.editorial, googlePlaceId }
    : { name: 'Ubicación', lat: latLng.lat, lng: latLng.lng, address: '', rating: null, ratingCount: 0, editorial: '', googlePlaceId }

  mapApi.flyTo(result.lat, result.lng, 16)
  mapApi.openSearchResultInfoWindow(result, store.trip.days, (dayId) => {
    const place = {
      name: result.name,
      lat: result.lat, lng: result.lng,
      desc: result.editorial || result.address,
      time: '', dur: '', tags: [],
      link: details?.website || '',
      googlePlaceId,
    }
    store.addPlace(dayId, place)
    show(`${result.name} añadido a Día ${dayId}`)
    rebuildMarkers()
  })
})
</script>

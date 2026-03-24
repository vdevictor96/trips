import { ref, watch, nextTick } from 'vue'
import { useTripStore } from '../stores/trip.js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function buildGmapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}+@${place.lat},${place.lng}`
}

function buildPopupHtml(place, color) {
  const gmapLink = buildGmapUrl(place)
  return `<b>${place.name}</b><br><span style="color:${color};font-weight:700">${place.time || ''}</span>${place.dur ? ' · ' + place.dur : ''}${place.desc ? '<br>' + place.desc : ''}<br><a href="${gmapLink}" target="_blank" style="color:#34a853">📍 Google Maps</a>${place.link ? ' · <a href="' + place.link + '" target="_blank">Más info →</a>' : ''}`
}

export function useMap() {
  const store = useTripStore()
  const map = ref(null)
  const markerLayers = ref({})
  const markerById = ref({})

  function initMap(el) {
    if (map.value) { map.value.remove(); map.value = null }
    markerLayers.value = {}
    markerById.value = {}

    map.value = L.map(el, {
      center: store.trip.mapCenter,
      zoom: store.trip.mapZoom,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map.value)

    setTimeout(() => map.value?.invalidateSize(), 100)
  }

  function buildMarkers(onMarkerClick) {
    if (!map.value || !store.trip) return
    // Clear existing
    Object.values(markerLayers.value).forEach(g => map.value.removeLayer(g))
    markerLayers.value = {}
    markerById.value = {}

    // Hotel
    if (store.trip.hotel) {
      const hotelIcon = L.divIcon({
        className: '',
        html: '<div class="marker-icon" style="background:#4b7bec;"><span>H</span></div>',
        iconSize: [32, 32], iconAnchor: [16, 32]
      })
      L.marker([store.trip.hotel.lat, store.trip.hotel.lng], { icon: hotelIcon })
        .bindPopup(`<b>🏨 ${store.trip.hotel.name}</b><br>Hotel base`)
        .addTo(map.value)
    }

    // Day markers
    store.trip.days.forEach(day => {
      const group = L.layerGroup()
      day.places.forEach((p, idx) => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="marker-icon" style="background:${day.color};"><span>${idx + 1}</span></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32]
        })
        const popup = buildPopupHtml(p, day.color)
        const marker = L.marker([p.lat, p.lng], { icon })
          .bindPopup(popup, { maxWidth: 260 })
          .addTo(group)
        markerById.value[p.id] = marker

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick(day.id, p.id)
        })
      })
      markerLayers.value[day.id] = group
      group.addTo(map.value)
    })

    // Discarded markers
    if (store.trip.discarded?.length) {
      const group = L.layerGroup()
      store.trip.discarded.forEach(p => {
        const icon = L.divIcon({
          className: '',
          html: '<div class="marker-icon" style="background:#666;opacity:.7;"><span>✕</span></div>',
          iconSize: [32, 32], iconAnchor: [16, 32]
        })
        const gmapLink = buildGmapUrl(p)
        const popup = `<b>${p.name}</b><br><span style="color:#999">${p.reason}</span><br>${p.desc}<br><a href="${gmapLink}" target="_blank" style="color:#34a853">📍 Google Maps</a>${p.link ? ' · <a href="' + p.link + '" target="_blank">Web →</a>' : ''}`
        L.marker([p.lat, p.lng], { icon }).bindPopup(popup, { maxWidth: 260 }).addTo(group)
      })
      markerLayers.value['discarded'] = group
    }
  }

  function updateVisibleLayers(dayId) {
    if (!map.value || !store.trip) return

    store.trip.days.forEach(d => {
      const layer = markerLayers.value[d.id]
      if (!layer) return
      if (dayId === null || dayId === 'info') {
        layer.addTo(map.value)
      } else if (d.id === dayId) {
        layer.addTo(map.value)
      } else {
        map.value.removeLayer(layer)
      }
    })

    // Discarded
    const discardedLayer = markerLayers.value['discarded']
    if (discardedLayer) {
      if (dayId === 'discarded') {
        discardedLayer.addTo(map.value)
      } else {
        map.value.removeLayer(discardedLayer)
      }
    }
  }

  function fitBounds(dayId) {
    if (!map.value || !store.trip) return

    if (dayId === null) {
      const allPts = store.trip.days.flatMap(d => d.places.map(p => [p.lat, p.lng]))
      if (allPts.length) map.value.fitBounds(L.latLngBounds(allPts), { padding: [60, 40], maxZoom: 13 })
    } else if (dayId === 'discarded' && store.trip.discarded?.length) {
      const bounds = L.latLngBounds(store.trip.discarded.map(p => [p.lat, p.lng]))
      map.value.fitBounds(bounds, { padding: [60, 40], maxZoom: 13 })
    } else if (dayId !== 'info' && dayId !== 'discarded') {
      const day = store.trip.days.find(d => d.id === dayId)
      if (day?.places.length) {
        const bounds = L.latLngBounds(day.places.map(p => [p.lat, p.lng]))
        map.value.fitBounds(bounds, { padding: [60, 40], maxZoom: 14 })
      }
    } else {
      map.value.setView(store.trip.mapCenter, store.trip.mapZoom)
    }
  }

  function flyTo(lat, lng, zoom = 16) {
    map.value?.flyTo([lat, lng], zoom, { duration: 0.8 })
  }

  function activateMarker(placeId) {
    // Deactivate previous
    if (store.activeMarkerId) {
      const prev = markerById.value[store.activeMarkerId]
      if (prev?._icon) prev._icon.querySelector('.marker-icon')?.classList.remove('active')
    }
    // Activate new
    if (placeId) {
      const marker = markerById.value[placeId]
      if (marker?._icon) marker._icon.querySelector('.marker-icon')?.classList.add('active')
    }
    store.setActiveMarker(placeId)
  }

  function openPopup(placeId) {
    const marker = markerById.value[placeId]
    if (marker) marker.openPopup()
  }

  function refreshMarkerPopup(placeId, place, dayColor) {
    const marker = markerById.value[placeId]
    if (!marker) return
    marker.setPopupContent(buildPopupHtml(place, dayColor))
  }

  function destroyMap() {
    if (map.value) { map.value.remove(); map.value = null }
    markerLayers.value = {}
    markerById.value = {}
  }

  function invalidateSize() {
    setTimeout(() => map.value?.invalidateSize(), 100)
  }

  return {
    map,
    markerLayers,
    markerById,
    initMap,
    buildMarkers,
    updateVisibleLayers,
    fitBounds,
    flyTo,
    activateMarker,
    openPopup,
    refreshMarkerPopup,
    destroyMap,
    invalidateSize,
  }
}

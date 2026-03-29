import { ref, watch } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { loadLibrary, isGoogleAvailable } from './googleLoader.js'
import { isDark } from './useTheme.js'

// Map styles
const LIGHT_STYLE = [] // Google's default

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
]

// Shared Google Maps URL builder (exported for PlaceCard etc.)
export function buildGmapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}+@${place.lat},${place.lng}`
}

// Popup HTML builder
function buildPopupHtml(place, color) {
  const gmapLink = buildGmapUrl(place)
  return `<div class="iw-custom"><b>${place.name}</b><br><span class="iw-time" style="--iw-time-color:${color}">${place.time || ''}</span>${place.dur ? ' · ' + place.dur : ''}${place.desc ? '<br><span class="iw-desc">' + place.desc + '</span>' : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>${place.link ? ' · <a href="' + place.link + '" target="_blank">Más info →</a>' : ''}</div>`
}

// HtmlMarker class — created after Google Maps API loads
let HtmlMarkerClass = null

function ensureHtmlMarkerClass() {
  if (HtmlMarkerClass) return

  HtmlMarkerClass = class extends google.maps.OverlayView {
    constructor(position, html, id) {
      super()
      this._position = new google.maps.LatLng(position.lat, position.lng)
      this._html = html
      this._id = id
      this._div = null
      this._clickHandler = null
      this._visible = true
    }

    onAdd() {
      this._div = document.createElement('div')
      this._div.className = 'gmap-marker-wrapper'
      this._div.innerHTML = this._html
      this._div.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this._clickHandler) this._clickHandler()
      })
      if (!this._visible) this._div.style.display = 'none'
      this.getPanes().overlayMouseTarget.appendChild(this._div)
    }

    draw() {
      if (!this._div) return
      const projection = this.getProjection()
      if (!projection) return
      const pos = projection.fromLatLngToDivPixel(this._position)
      if (pos) {
        this._div.style.left = (pos.x - 16) + 'px'
        this._div.style.top = (pos.y - 32) + 'px'
      }
    }

    onRemove() {
      this._div?.parentElement?.removeChild(this._div)
      this._div = null
    }

    onClick(handler) {
      this._clickHandler = handler
      return this
    }

    setVisible(visible) {
      this._visible = visible
      if (this._div) this._div.style.display = visible ? '' : 'none'
    }

    getElement() {
      return this._div
    }

    getPosition() {
      return this._position
    }
  }
}

export function useMap() {
  const store = useTripStore()
  const map = ref(null)
  const markersByDay = ref({})
  const markerById = ref({})
  const searchMarkers = ref([])
  const hotelMarker = ref(null)
  let infoWindow = null
  let poiClickHandler = null

  async function initMap(el) {
    if (map.value) destroyMap()

    if (!isGoogleAvailable()) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:14px;text-align:center;padding:20px;">Configura VITE_GOOGLE_API_KEY para ver el mapa</div>'
      return
    }

    try {
      await loadLibrary('maps')
      ensureHtmlMarkerClass()

      const [lat, lng] = store.trip.mapCenter

      map.value = new google.maps.Map(el, {
        center: { lat, lng },
        zoom: store.trip.mapZoom,
        styles: isDark.value ? DARK_STYLE : LIGHT_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
        clickableIcons: true,
        gestureHandling: 'greedy',
      })

      infoWindow = new google.maps.InfoWindow({ maxWidth: 280 })

      // Map click: close InfoWindow or intercept native POI clicks
      map.value.addListener('click', (e) => {
        if (e.placeId && poiClickHandler) {
          e.stop() // prevent Google's default POI InfoWindow
          poiClickHandler(e.placeId, { lat: e.latLng.lat(), lng: e.latLng.lng() })
          return
        }
        infoWindow.close()
      })
    } catch (e) {
      console.error('Failed to init Google Maps:', e)
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:14px;text-align:center;padding:20px;">Error cargando Google Maps</div>'
    }
  }

  function buildMarkers(onMarkerClick) {
    if (!map.value || !store.trip) return
    clearAllMarkers()

    // Hotel
    if (store.trip.hotel) {
      const html = '<div class="marker-icon" style="background:#4b7bec;"><span>H</span></div>'
      const marker = new HtmlMarkerClass(
        { lat: store.trip.hotel.lat, lng: store.trip.hotel.lng },
        html, 'hotel'
      )
      marker.onClick(() => {
        infoWindow.setContent(`<div class="iw-custom"><b>🏨 ${store.trip.hotel.name}</b><br>Hotel base</div>`)
        infoWindow.setPosition(marker.getPosition())
        infoWindow.open(map.value)
      })
      marker.setMap(map.value)
      hotelMarker.value = marker
    }

    // Day markers
    store.trip.days.forEach(day => {
      const dayMarkers = []
      day.places.forEach((p, idx) => {
        const html = `<div class="marker-icon" style="background:${day.color};"><span>${idx + 1}</span></div>`
        const marker = new HtmlMarkerClass({ lat: p.lat, lng: p.lng }, html, p.id)
        marker.onClick(() => {
          if (onMarkerClick) onMarkerClick(day.id, p.id)
        })
        marker.setMap(map.value)
        dayMarkers.push(marker)
        markerById.value[p.id] = marker
      })
      markersByDay.value[day.id] = dayMarkers
    })

    // Discarded markers
    if (store.trip.discarded?.length) {
      const discardedMarkers = []
      store.trip.discarded.forEach(p => {
        const html = '<div class="marker-icon" style="background:#666;opacity:.7;"><span>✕</span></div>'
        const marker = new HtmlMarkerClass({ lat: p.lat, lng: p.lng }, html, p.id)
        marker.onClick(() => {
          const gmapLink = buildGmapUrl(p)
          infoWindow.setContent(
            `<div class="iw-custom"><b>${p.name}</b><br><span class="iw-desc">${p.reason || ''}</span>${p.desc ? '<br><span class="iw-desc">' + p.desc + '</span>' : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>${p.link ? ' · <a href="' + p.link + '" target="_blank">Web →</a>' : ''}</div>`
          )
          infoWindow.setPosition(marker.getPosition())
          infoWindow.open(map.value)
        })
        marker.setMap(map.value)
        discardedMarkers.push(marker)
      })
      markersByDay.value['discarded'] = discardedMarkers
    }
  }

  function clearAllMarkers() {
    Object.values(markersByDay.value).forEach(markers => {
      markers.forEach(m => m.setMap(null))
    })
    markersByDay.value = {}
    markerById.value = {}
    if (hotelMarker.value) {
      hotelMarker.value.setMap(null)
      hotelMarker.value = null
    }
  }

  function updateVisibleLayers(dayId) {
    if (!map.value || !store.trip) return

    store.trip.days.forEach(d => {
      const markers = markersByDay.value[d.id]
      if (!markers) return
      const visible = dayId === null || dayId === 'info' || d.id === dayId
      markers.forEach(m => m.setVisible(visible))
    })

    const discardedMarkers = markersByDay.value['discarded']
    if (discardedMarkers) {
      const visible = dayId === 'discarded'
      discardedMarkers.forEach(m => m.setVisible(visible))
    }
  }

  function fitBounds(dayId) {
    if (!map.value || !store.trip) return

    let places = []
    if (dayId === null) {
      places = store.trip.days.flatMap(d => d.places)
    } else if (dayId === 'discarded' && store.trip.discarded?.length) {
      places = store.trip.discarded
    } else if (dayId !== 'info' && dayId !== 'discarded' && dayId !== 'notes') {
      const day = store.trip.days.find(d => d.id === dayId)
      places = day?.places || []
    }

    if (!places.length) {
      map.value.setCenter({ lat: store.trip.mapCenter[0], lng: store.trip.mapCenter[1] })
      map.value.setZoom(store.trip.mapZoom)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    places.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
    map.value.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 })

    // Prevent over-zoom for single/nearby places
    const listener = google.maps.event.addListener(map.value, 'idle', () => {
      if (map.value.getZoom() > 16) map.value.setZoom(16)
      google.maps.event.removeListener(listener)
    })
  }

  function flyTo(lat, lng, zoom = 16) {
    if (!map.value) return
    map.value.panTo({ lat, lng })
    if (map.value.getZoom() < zoom) map.value.setZoom(zoom)
  }

  function activateMarker(placeId) {
    // Deactivate previous
    if (store.activeMarkerId) {
      const prev = markerById.value[store.activeMarkerId]
      if (prev?.getElement()) {
        prev.getElement().querySelector('.marker-icon')?.classList.remove('active')
      }
    }
    // Activate new
    if (placeId) {
      const marker = markerById.value[placeId]
      if (marker?.getElement()) {
        marker.getElement().querySelector('.marker-icon')?.classList.add('active')
      }
    }
    store.setActiveMarker(placeId)
  }

  function openPopup(placeId) {
    const marker = markerById.value[placeId]
    if (!marker || !map.value) return

    // Find the place data to build popup content
    let place = null
    let color = '#fff'
    for (const day of (store.trip?.days || [])) {
      const found = day.places.find(p => p.id === placeId)
      if (found) {
        place = found
        color = day.color
        break
      }
    }
    if (!place) return

    infoWindow.setContent(buildPopupHtml(place, color))
    infoWindow.setPosition(marker.getPosition())
    infoWindow.open(map.value)
  }

  function refreshMarkerPopup(placeId, place, dayColor) {
    // If the info window is currently showing this place, update it
    // The next time openPopup is called it will use fresh data
    // No need to update the overlay marker itself since it's just a colored pin
  }

  function onPoiClick(handler) {
    poiClickHandler = handler
  }

  // React to theme changes on the map
  watch(isDark, (dark) => {
    if (map.value) map.value.setOptions({ styles: dark ? DARK_STYLE : LIGHT_STYLE })
  })

  function destroyMap() {
    clearAllMarkers()
    clearSearchMarkers()
    if (infoWindow) { infoWindow.close(); infoWindow = null }
    map.value = null
  }

  function invalidateSize() {
    if (map.value) {
      google.maps.event.trigger(map.value, 'resize')
    }
  }

  // Search result markers
  function showSearchMarkers(results) {
    clearSearchMarkers()
    if (!map.value) return

    results.forEach((r, i) => {
      const html = `<div class="marker-icon search-pin" style="background:#ea4335;"><span>${i + 1}</span></div>`
      const marker = new HtmlMarkerClass({ lat: r.lat, lng: r.lng }, html, `search-${i}`)
      marker.onClick(() => {
        infoWindow.setContent(
          `<div class="iw-custom"><b>${r.name}</b>${r.address ? '<br><span class="iw-desc">' + r.address + '</span>' : ''}${r.rating ? '<br>⭐ ' + r.rating.toFixed(1) : ''}</div>`
        )
        infoWindow.setPosition(marker.getPosition())
        infoWindow.open(map.value)
      })
      marker.setMap(map.value)
      searchMarkers.value.push(marker)
    })
  }

  function clearSearchMarkers() {
    searchMarkers.value.forEach(m => m.setMap(null))
    searchMarkers.value = []
  }

  function openSearchResultInfoWindow(result, days, onAdd) {
    if (!map.value) return

    const dayOptions = days.map(d =>
      `<option value="${d.id}">Día ${d.id}</option>`
    ).join('')

    const html = `<div class="iw-custom iw-search-result">
      <b>${result.name}</b>
      ${result.rating ? '<br>⭐ ' + result.rating.toFixed(1) + (result.ratingCount ? ' <span class="iw-desc">(' + result.ratingCount + ')</span>' : '') : ''}
      ${result.address ? '<br><span class="iw-desc">' + result.address + '</span>' : ''}
      <div class="iw-add-form">
        <select id="iw-day-select">${dayOptions}</select>
        <button id="iw-add-btn">+ Añadir</button>
      </div>
    </div>`

    infoWindow.setContent(html)
    infoWindow.setPosition({ lat: result.lat, lng: result.lng })
    infoWindow.open(map.value)

    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const btn = document.getElementById('iw-add-btn')
      const select = document.getElementById('iw-day-select')
      if (btn && select) {
        btn.addEventListener('click', () => {
          const dayId = parseInt(select.value)
          onAdd(dayId)
          infoWindow.close()
        })
      }
    })
  }

  return {
    map,
    markersByDay,
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
    showSearchMarkers,
    clearSearchMarkers,
    openSearchResultInfoWindow,
    onPoiClick,
  }
}

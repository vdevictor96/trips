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
export function buildGmapUrl(place, city) {
  const q = city ? `${place.name}, ${city}` : place.name
  let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
  // If we have the Google Place ID (places added from the app), pass it so
  // Maps selects the exact place instead of guessing from the text query.
  if (place.googlePlaceId) url += `&query_place_id=${encodeURIComponent(place.googlePlaceId)}`
  return url
}

// Popup HTML builder
function buildPopupHtml(place, color, city) {
  const gmapLink = buildGmapUrl(place, city)
  return `<div class="iw-custom"><b>${place.name}</b><br><span class="iw-time" style="--iw-time-color:${color}">${place.time || ''}</span>${place.dur ? ' · ' + place.dur : ''}${place.desc ? '<br><span class="iw-desc">' + place.desc + '</span>' : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>${place.link ? ' · <a href="' + place.link + '" target="_blank">Más info →</a>' : ''}</div>`
}

// Timestamp of the last interaction with one of our custom pins. Google may
// fire a native POI click for an icon sitting underneath a pin right after the
// pin is tapped; we use this to ignore that click so the pin's popup isn't
// hijacked and the camera doesn't jump away. See the map 'click' listener.
let lastMarkerInteractionTs = 0

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
      // Record the interaction as early as possible (pointerdown fires before
      // any resulting click), so the map's POI handler can tell that a native
      // POI click that lands next was really a tap on this pin.
      this._div.addEventListener('pointerdown', () => {
        lastMarkerInteractionTs = Date.now()
      })
      this._div.addEventListener('click', (e) => {
        e.stopPropagation()
        lastMarkerInteractionTs = Date.now()
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

// "My location" control icon (Material "my_location")
const LOCATE_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3A9 9 0 0013 3.06V1h-2v2.06A9 9 0 003.06 11H1v2h2.06A9 9 0 0011 20.94V23h2v-2.06A9 9 0 0020.94 13H23v-2zM12 19a7 7 0 110-14 7 7 0 010 14z"/></svg>'
const LAYERS_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>'

// User-location dot overlay — centered on the point (unlike the teardrop markers)
let LocationDotClass = null

function ensureLocationDotClass() {
  if (LocationDotClass) return

  LocationDotClass = class extends google.maps.OverlayView {
    constructor(position) {
      super()
      this._position = new google.maps.LatLng(position.lat, position.lng)
      this._div = null
    }

    setPosition(position) {
      this._position = new google.maps.LatLng(position.lat, position.lng)
      this.draw()
    }

    onAdd() {
      this._div = document.createElement('div')
      this._div.className = 'user-location-dot'
      this._div.innerHTML = '<div class="user-location-pulse"></div><div class="user-location-core"></div>'
      this.getPanes().overlayLayer.appendChild(this._div)
    }

    draw() {
      if (!this._div) return
      const projection = this.getProjection()
      if (!projection) return
      const pos = projection.fromLatLngToDivPixel(this._position)
      if (pos) {
        this._div.style.left = pos.x + 'px'
        this._div.style.top = pos.y + 'px'
      }
    }

    onRemove() {
      this._div?.parentElement?.removeChild(this._div)
      this._div = null
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

  // Geolocation ("locate me") state
  let userLocationDot = null
  let accuracyCircle = null
  let locationWatchId = null
  let locateButton = null
  let mapTypeButton = null
  let satelliteOn = false
  let didCenterOnUser = false

  async function initMap(el) {
    if (map.value) destroyMap()

    if (!isGoogleAvailable()) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:14px;text-align:center;padding:20px;">Configura VITE_GOOGLE_API_KEY para ver el mapa</div>'
      return
    }

    try {
      await loadLibrary('maps')
      ensureHtmlMarkerClass()
      ensureLocationDotClass()

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
          // If the user just tapped one of our custom pins, Google can also
          // fire a native POI click for an icon underneath it. Ignore it so
          // the pin's popup stays open and the camera doesn't jump away.
          if (Date.now() - lastMarkerInteractionTs < 700) return
          poiClickHandler(e.placeId, { lat: e.latLng.lat(), lng: e.latLng.lng() })
          return
        }
        infoWindow.close()
      })

      // "My location" control (like Google Maps), under the zoom controls
      locateButton = createLocateButton()
      map.value.controls[google.maps.ControlPosition.RIGHT_CENTER].push(locateButton)

      // Satellite/roadmap toggle, stacked under the locate control
      mapTypeButton = createMapTypeButton()
      map.value.controls[google.maps.ControlPosition.RIGHT_CENTER].push(mapTypeButton)
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
      const html = '<div class="marker-icon" style="background:#2d3436;"><span>🛏️</span></div>'
      const marker = new HtmlMarkerClass(
        { lat: store.trip.hotel.lat, lng: store.trip.hotel.lng },
        html, 'hotel'
      )
      marker.onClick(() => {
        infoWindow.setContent(`<div class="iw-custom"><b>🛏️ ${store.trip.hotel.name}</b><br>Hotel base</div>`)
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
          const gmapLink = buildGmapUrl(p, store.trip?.city)
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

    // Restaurant markers
    if (store.trip.restaurants?.length) {
      const restaurantMarkers = []
      store.trip.restaurants.forEach(p => {
        if (p.lat == null || p.lng == null) return
        const html = '<div class="marker-icon" style="background:#e67e22;"><span>🍴</span></div>'
        const marker = new HtmlMarkerClass({ lat: p.lat, lng: p.lng }, html, p.id)
        marker.onClick(() => {
          const gmapLink = buildGmapUrl(p, store.trip?.city)
          infoWindow.setContent(
            `<div class="iw-custom"><b>${p.name}</b>${p.cat ? '<br><span class="iw-desc">' + p.cat + '</span>' : ''}${p.desc ? '<br><span class="iw-desc">' + p.desc + '</span>' : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>${p.link ? ' · <a href="' + p.link + '" target="_blank">Web →</a>' : ''}</div>`
          )
          infoWindow.setPosition(marker.getPosition())
          infoWindow.open(map.value)
        })
        marker.setMap(map.value)
        restaurantMarkers.push(marker)
      })
      markersByDay.value['restaurants'] = restaurantMarkers
    }

    // Cafe markers
    if (store.trip.cafes?.length) {
      const cafeMarkers = []
      store.trip.cafes.forEach(p => {
        if (p.lat == null || p.lng == null) return
        const html = '<div class="marker-icon" style="background:#8d6e63;"><span>☕</span></div>'
        const marker = new HtmlMarkerClass({ lat: p.lat, lng: p.lng }, html, p.id)
        marker.onClick(() => {
          const gmapLink = buildGmapUrl(p, store.trip?.city)
          infoWindow.setContent(
            `<div class="iw-custom"><b>${p.name}</b>${p.cat ? '<br><span class="iw-desc">' + p.cat + '</span>' : ''}${p.desc ? '<br><span class="iw-desc">' + p.desc + '</span>' : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>${p.link ? ' · <a href="' + p.link + '" target="_blank">Web →</a>' : ''}</div>`
          )
          infoWindow.setPosition(marker.getPosition())
          infoWindow.open(map.value)
        })
        marker.setMap(map.value)
        cafeMarkers.push(marker)
      })
      markersByDay.value['cafes'] = cafeMarkers
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

    const restaurantMarkers = markersByDay.value['restaurants']
    if (restaurantMarkers) {
      // Overlay: visibles en su propia pestaña, o sobre cualquier día/overview si el toggle está activo
      const visible = store.showRestaurants || dayId === 'restaurants'
      restaurantMarkers.forEach(m => m.setVisible(visible))
    }

    const cafeMarkers = markersByDay.value['cafes']
    if (cafeMarkers) {
      // Overlay: visibles en su propia pestaña, o sobre cualquier día/overview si el toggle está activo
      const visible = store.showCafes || dayId === 'cafes'
      cafeMarkers.forEach(m => m.setVisible(visible))
    }

    // HUD de diagnóstico temporal: refleja en pantalla si los markers están
    // construidos y cuántos quedan visibles (display != none) tras actualizar.
    if (typeof window !== 'undefined' && window.__hud) {
      const r = markersByDay.value['restaurants'] || []
      const c = markersByDay.value['cafes'] || []
      const vis = arr => arr.filter(m => m.getElement() && m.getElement().style.display !== 'none').length
      window.__hud(`day=${dayId} showR=${store.showRestaurants} showC=${store.showCafes} · R build=${r.length} vis=${vis(r)} · C build=${c.length} vis=${vis(c)} · onMap=${!!map.value}`)
    }
  }

  function fitBounds(dayId) {
    if (!map.value || !store.trip) return

    let places = []
    if (dayId === null) {
      places = store.trip.days.flatMap(d => d.places)
    } else if (dayId === 'discarded' && store.trip.discarded?.length) {
      places = store.trip.discarded
    } else if (dayId === 'restaurants' && store.trip.restaurants?.length) {
      places = store.trip.restaurants.filter(p => p.lat != null && p.lng != null)
    } else if (dayId === 'cafes' && store.trip.cafes?.length) {
      places = store.trip.cafes.filter(p => p.lat != null && p.lng != null)
    } else if (dayId !== 'info' && dayId !== 'discarded' && dayId !== 'notes' && dayId !== 'restaurants' && dayId !== 'cafes') {
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

    infoWindow.setContent(buildPopupHtml(place, color, store.trip?.city))
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

  // ── Geolocation: show & track the user's position, like Google Maps ──
  function createLocateButton() {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'map-locate-btn'
    btn.title = 'Mostrar mi ubicación'
    btn.setAttribute('aria-label', 'Mostrar mi ubicación')
    btn.innerHTML = LOCATE_ICON
    btn.addEventListener('click', locateUser)
    return btn
  }

  function createMapTypeButton() {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'map-type-btn'
    btn.title = 'Vista satélite'
    btn.setAttribute('aria-label', 'Cambiar a vista satélite')
    btn.innerHTML = LAYERS_ICON
    btn.addEventListener('click', toggleMapType)
    return btn
  }

  function toggleMapType() {
    if (!map.value) return
    satelliteOn = !satelliteOn
    // hybrid = satélite con etiquetas de calles (más legible que satellite puro)
    map.value.setMapTypeId(satelliteOn ? 'hybrid' : 'roadmap')
    mapTypeButton?.classList.toggle('active', satelliteOn)
    mapTypeButton?.setAttribute('title', satelliteOn ? 'Vista mapa' : 'Vista satélite')
  }

  function locateUser() {
    if (!map.value) return
    if (!('geolocation' in navigator)) {
      flashLocateError()
      return
    }
    locateButton?.classList.add('locating')
    didCenterOnUser = false

    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    // One-shot fix to recenter quickly, then keep watching for live updates.
    navigator.geolocation.getCurrentPosition(onPosition, onPositionError, opts)
    if (locationWatchId === null) {
      locationWatchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
        enableHighAccuracy: true, maximumAge: 5000,
      })
    }
  }

  function onPosition(pos) {
    const { latitude, longitude, accuracy } = pos.coords
    updateUserLocation(latitude, longitude, accuracy)
    locateButton?.classList.remove('locating')
    locateButton?.classList.add('located')
    if (!didCenterOnUser) {
      didCenterOnUser = true
      flyTo(latitude, longitude, 15)
    }
  }

  function onPositionError(err) {
    locateButton?.classList.remove('locating', 'located')
    if (err.code === err.PERMISSION_DENIED && locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId)
      locationWatchId = null
    }
    flashLocateError()
  }

  function flashLocateError() {
    if (!locateButton) return
    locateButton.classList.add('error')
    setTimeout(() => locateButton?.classList.remove('error'), 1500)
  }

  function updateUserLocation(lat, lng, accuracy) {
    if (!map.value) return
    ensureLocationDotClass()

    if (!userLocationDot) {
      userLocationDot = new LocationDotClass({ lat, lng })
      userLocationDot.setMap(map.value)
    } else {
      userLocationDot.setPosition({ lat, lng })
    }

    if (!accuracyCircle) {
      accuracyCircle = new google.maps.Circle({
        map: map.value,
        center: { lat, lng },
        radius: accuracy,
        strokeColor: '#4285F4', strokeOpacity: 0.4, strokeWeight: 1,
        fillColor: '#4285F4', fillOpacity: 0.12,
        clickable: false, zIndex: 1,
      })
    } else {
      accuracyCircle.setCenter({ lat, lng })
      accuracyCircle.setRadius(accuracy)
    }
  }

  function clearUserLocation() {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId)
      locationWatchId = null
    }
    if (userLocationDot) { userLocationDot.setMap(null); userLocationDot = null }
    if (accuracyCircle) { accuracyCircle.setMap(null); accuracyCircle = null }
    locateButton = null
    didCenterOnUser = false
  }

  // React to theme changes on the map
  watch(isDark, (dark) => {
    if (map.value) map.value.setOptions({ styles: dark ? DARK_STYLE : LIGHT_STYLE })
  })

  function destroyMap() {
    clearAllMarkers()
    clearSearchMarkers()
    clearUserLocation()
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
        const gmapLink = buildGmapUrl(r, store.trip?.city)
        infoWindow.setContent(
          `<div class="iw-custom"><b>${r.name}</b>${r.address ? '<br><span class="iw-desc">' + r.address + '</span>' : ''}${r.rating ? '<br>⭐ ' + r.rating.toFixed(1) : ''}<br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a></div>`
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
      `<option value="${d.id}">${d.wildcard ? '🃏 Pendientes' : 'Día ' + d.id}</option>`
    ).join('')

    const gmapLink = buildGmapUrl(result, store.trip?.city)
    const html = `<div class="iw-custom iw-search-result">
      <b>${result.name}</b>
      ${result.rating ? '<br>⭐ ' + result.rating.toFixed(1) + (result.ratingCount ? ' <span class="iw-desc">(' + result.ratingCount + ')</span>' : '') : ''}
      ${result.address ? '<br><span class="iw-desc">' + result.address + '</span>' : ''}
      <br><a href="${gmapLink}" target="_blank" class="gmaps-link">📍 Google Maps</a>
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
          // Los días normales tienen id numérico; el comodín usa 'pending'
          const raw = select.value
          const dayId = /^\d+$/.test(raw) ? parseInt(raw) : raw
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

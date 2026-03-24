import { ref } from 'vue'
import { loadLibrary, isGoogleAvailable as checkAvailable } from './googleLoader.js'

const placesLib = ref(null)
const loading = ref(false)
const loadError = ref(false)

// Session cache for place details
const detailsCache = {}

async function ensureLoaded() {
  if (placesLib.value) return true
  if (loadError.value || !checkAvailable()) return false
  if (loading.value) {
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (placesLib.value || loadError.value) { clearInterval(check); resolve() }
      }, 50)
    })
    return !!placesLib.value
  }

  loading.value = true
  try {
    placesLib.value = await loadLibrary('places')
    return true
  } catch (e) {
    console.warn('Google Places API failed to load:', e)
    loadError.value = true
    return false
  } finally {
    loading.value = false
  }
}

export function useGooglePlaces() {
  function isAvailable() {
    return checkAvailable()
  }

  async function searchPlaces(query, lat, lng, radius = 10000) {
    if (!await ensureLoaded()) return []
    try {
      const { Place } = placesLib.value
      const request = {
        textQuery: query,
        locationBias: {
          center: { lat, lng },
          radius,
        },
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'photos', 'editorialSummary'],
        maxResultCount: 10,
        language: 'es',
      }
      const { places } = await Place.searchByText(request)
      return (places || []).map(p => ({
        googlePlaceId: p.id,
        name: p.displayName?.text || p.displayName || '',
        address: p.formattedAddress || '',
        lat: p.location?.lat() ?? 0,
        lng: p.location?.lng() ?? 0,
        rating: p.rating || null,
        ratingCount: p.userRatingCount || 0,
        editorial: p.editorialSummary?.text || '',
        photoRef: p.photos?.[0] || null,
      }))
    } catch (e) {
      console.warn('Google Places search error:', e)
      return []
    }
  }

  async function getPlaceDetails(googlePlaceId) {
    if (!googlePlaceId) return null

    // Check cache
    if (detailsCache[googlePlaceId]) return detailsCache[googlePlaceId]

    if (!await ensureLoaded()) return null
    try {
      const { Place } = placesLib.value
      const place = new Place({ id: googlePlaceId })
      await place.fetchFields({
        fields: [
          'id', 'displayName', 'formattedAddress', 'location',
          'rating', 'userRatingCount', 'photos',
          'currentOpeningHours', 'websiteURI', 'googleMapsURI',
          'editorialSummary', 'reviews',
        ],
      })

      const details = {
        googlePlaceId: place.id,
        name: place.displayName?.text || place.displayName || '',
        address: place.formattedAddress || '',
        lat: place.location?.lat() ?? 0,
        lng: place.location?.lng() ?? 0,
        rating: place.rating || null,
        ratingCount: place.userRatingCount || 0,
        editorial: place.editorialSummary?.text || '',
        website: place.websiteURI || '',
        googleMapsUrl: place.googleMapsURI || '',
        photos: (place.photos || []).slice(0, 8),
        openingHours: place.currentOpeningHours?.weekdayDescriptions || [],
        reviews: (place.reviews || []).slice(0, 3).map(r => ({
          author: r.authorAttribution?.displayName || '',
          rating: r.rating || 0,
          text: r.text?.text || r.text || '',
          time: r.relativePublishTimeDescription || '',
        })),
      }

      detailsCache[googlePlaceId] = details
      return details
    } catch (e) {
      console.warn('Google Places details error:', e)
      return null
    }
  }

  function getPhotoUrl(photoObj, maxWidth = 400) {
    if (!photoObj) return null
    try {
      return photoObj.getURI({ maxWidth })
    } catch {
      return null
    }
  }

  async function findPlaceByNameAndLocation(name, lat, lng) {
    const results = await searchPlaces(name, lat, lng, 500)
    if (results.length > 0) return results[0]
    return null
  }

  return {
    isAvailable,
    searchPlaces,
    getPlaceDetails,
    getPhotoUrl,
    findPlaceByNameAndLocation,
  }
}

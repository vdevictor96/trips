const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
let initialized = false
const loadedLibraries = {}

export function isGoogleAvailable() {
  return !!API_KEY
}

export async function loadLibrary(name) {
  if (!API_KEY) throw new Error('No Google API key configured')

  if (loadedLibraries[name]) return loadedLibraries[name]

  const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')

  if (!initialized) {
    setOptions({ key: API_KEY, v: 'weekly' })
    initialized = true
  }

  loadedLibraries[name] = await importLibrary(name)
  return loadedLibraries[name]
}

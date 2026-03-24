const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
let loaderPromise = null
const loadedLibraries = {}

export function isGoogleAvailable() {
  return !!API_KEY
}

export async function loadLibrary(name) {
  if (!API_KEY) throw new Error('No Google API key configured')

  if (loadedLibraries[name]) return loadedLibraries[name]

  if (!loaderPromise) {
    loaderPromise = import('@googlemaps/js-api-loader').then(({ Loader }) => {
      return new Loader({ apiKey: API_KEY, version: 'weekly' })
    })
  }

  const loader = await loaderPromise
  loadedLibraries[name] = await loader.importLibrary(name)
  return loadedLibraries[name]
}

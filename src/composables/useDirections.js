export function useDirections() {
  function makeDirectionsURL(places) {
    if (places.length === 0) return ''
    const pts = places.map(p => `${p.lat},${p.lng}`)
    const origin = pts[0]
    const dest = pts[pts.length - 1]
    const waypoints = pts.slice(1, -1).join('|')
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`
    if (waypoints) url += `&waypoints=${waypoints}`
    return url
  }

  function getDirectionsURLs(places) {
    if (!places || places.length === 0) return []
    // Google Maps web URLs support ~10 waypoints reliably (origin + dest + 8 intermediate)
    const MAX_POINTS = 10
    if (places.length <= MAX_POINTS) {
      return [{ url: makeDirectionsURL(places), label: 'Abrir ruta del día en Google Maps', from: 1, to: places.length }]
    }
    // Split into chunks with 1 overlap
    const chunks = []
    let start = 0
    while (start < places.length) {
      const end = Math.min(start + MAX_POINTS, places.length)
      chunks.push({ places: places.slice(start, end), from: start + 1, to: end })
      start = end - 1 // overlap by 1
      if (start >= places.length - 1) break
    }
    return chunks.map((chunk, i) => ({
      url: makeDirectionsURL(chunk.places),
      label: `Ruta parte ${i + 1} (sitios ${chunk.from}-${chunk.to})`,
      from: chunk.from,
      to: chunk.to,
    }))
  }

  return { makeDirectionsURL, getDirectionsURLs }
}

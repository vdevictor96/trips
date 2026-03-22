import { ref } from 'vue'
import { db, hasConfig } from '../firebase.js'
import { onValue, set, ref as dbRef, serverTimestamp, get } from 'firebase/database'

const syncing = ref(false)
let unsubscribe = null
let pushTimeout = null
let lastPushTime = 0
const PUSH_DEBOUNCE = 1000

export function useSync() {
  function initSync(tripId, onRemoteChange) {
    if (!hasConfig) return
    stopSync()

    const tripRef = dbRef(db, `trips/${tripId}/data`)
    unsubscribe = onValue(tripRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) return
      // Skip if we just pushed (avoid echo)
      if (Date.now() - lastPushTime < PUSH_DEBOUNCE + 200) return
      syncing.value = true
      onRemoteChange(data)
      syncing.value = false
    })
  }

  function pushEdits(tripId, tripData) {
    if (!hasConfig) return
    clearTimeout(pushTimeout)
    pushTimeout = setTimeout(async () => {
      try {
        lastPushTime = Date.now()
        const tripRef = dbRef(db, `trips/${tripId}/data`)
        await set(tripRef, JSON.parse(JSON.stringify(tripData)))
        const tsRef = dbRef(db, `trips/${tripId}/lastModified`)
        await set(tsRef, serverTimestamp())
      } catch (e) {
        console.warn('[sync] push failed:', e.message)
      }
    }, PUSH_DEBOUNCE)
  }

  async function fetchRemote(tripId) {
    if (!hasConfig) return null
    try {
      const tripRef = dbRef(db, `trips/${tripId}/data`)
      const snapshot = await get(tripRef)
      return snapshot.val()
    } catch {
      return null
    }
  }

  function stopSync() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    clearTimeout(pushTimeout)
  }

  return { initSync, pushEdits, fetchRemote, stopSync, syncing }
}

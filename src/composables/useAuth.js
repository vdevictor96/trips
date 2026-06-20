import { ref } from 'vue'
import { auth, hasConfig } from '../firebase.js'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'

// Singleton: auth state shared across the whole app
const user = ref(null)
const authReady = ref(false) // true once Firebase has resolved the persisted session
let initialized = false

export function useAuth() {
  function initAuth() {
    if (!hasConfig) {
      // No Firebase: nothing to protect and nothing to authenticate against
      authReady.value = true
      return
    }
    if (initialized) return
    initialized = true
    // Local persistence = "memory": the session survives reloads/closes
    setPersistence(auth, browserLocalPersistence).catch(() => {})
    onAuthStateChanged(auth, (u) => {
      user.value = u
      authReady.value = true
    })
  }

  async function login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.code || e.message }
    }
  }

  function logout() {
    return signOut(auth)
  }

  return { user, authReady, initAuth, login, logout }
}

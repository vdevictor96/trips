import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  function show(message, { duration = 4000, type = 'info' } = {}) {
    const id = nextId++
    const toast = { id, message, type, undoFn: null, visible: true }
    toasts.value.push(toast)
    setTimeout(() => dismiss(id), duration)
    return id
  }

  function showUndo(message, undoFn, { duration = 5000 } = {}) {
    const id = nextId++
    const toast = { id, message, type: 'undo', undoFn, visible: true }
    toasts.value.push(toast)
    setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function handleUndo(toast) {
    if (toast.undoFn) toast.undoFn()
    dismiss(toast.id)
  }

  return { toasts, show, showUndo, dismiss, handleUndo }
}

<template>
  <div ref="sheetEl" class="sheet collapsed">
    <div class="sheet-handle" ref="handleEl">
      <span></span>
    </div>
    <slot name="search" />
    <slot name="tabs" />
    <div class="sheet-body">
      <slot name="body" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const sheetEl = ref(null)
const handleEl = ref(null)

function expand() {
  sheetEl.value?.classList.remove('collapsed')
  sheetEl.value?.classList.add('expanded')
}

function collapse() {
  sheetEl.value?.classList.add('collapsed')
  sheetEl.value?.classList.remove('expanded')
}

function toggle() {
  if (sheetEl.value?.classList.contains('collapsed')) expand()
  else collapse()
}

onMounted(() => {
  const handle = handleEl.value
  let startY = 0
  let dragging = false

  // Touch events (mobile)
  handle.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY
  }, { passive: true })

  handle.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY
    if (dy > 40) collapse()
    else if (dy < -40) expand()
    else toggle() // tap
  }, { passive: true })

  // Mouse events (desktop)
  function onMouseDown(e) {
    startY = e.clientY
    dragging = true
    document.addEventListener('mouseup', onMouseUp)
    // Prevent text selection while dragging
    e.preventDefault()
  }

  function onMouseUp(e) {
    if (!dragging) return
    dragging = false
    document.removeEventListener('mouseup', onMouseUp)
    const dy = e.clientY - startY
    if (dy > 40) collapse()
    else if (dy < -40) expand()
    else toggle() // click
  }

  handle.addEventListener('mousedown', onMouseDown)

  // Store cleanup ref
  handle._cleanup = () => {
    handle.removeEventListener('mousedown', onMouseDown)
    document.removeEventListener('mouseup', onMouseUp)
  }
})

onBeforeUnmount(() => {
  handleEl.value?._cleanup?.()
})

defineExpose({ expand, collapse, toggle })
</script>

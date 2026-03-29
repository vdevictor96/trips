<template>
  <div ref="sheetEl" class="sheet collapsed">
    <div class="sheet-handle" ref="handleEl">
      <span></span>
    </div>
    <slot name="search" />
    <slot name="tabs" />
    <div class="sheet-body" ref="bodyEl">
      <slot name="body" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const sheetEl = ref(null)
const handleEl = ref(null)
const bodyEl = ref(null)

let isExpanded = false

function expand() {
  isExpanded = true
  sheetEl.value?.classList.remove('collapsed')
  sheetEl.value?.classList.add('expanded')
}

function collapse() {
  isExpanded = false
  sheetEl.value?.classList.add('collapsed')
  sheetEl.value?.classList.remove('expanded')
}

function toggle() {
  if (isExpanded) collapse()
  else expand()
}

onMounted(() => {
  const sheet = sheetEl.value
  const body = bodyEl.value
  if (!sheet) return

  let startY = 0
  let startTime = 0
  let dragging = false
  let touchInBody = false
  let ignoreTouch = false
  let touchOnInteractive = false
  let decidedScroll = false // true = let browser scroll, don't drag

  function isInteractive(target) {
    return target.closest('input, textarea, select, a, button, .drag-handle')
  }

  // --- Touch events (mobile) ---
  sheet.addEventListener('touchstart', e => {
    ignoreTouch = false
    touchOnInteractive = isInteractive(e.target)
    startY = e.touches[0].clientY
    startTime = Date.now()
    dragging = false
    decidedScroll = false
    touchInBody = !!(body && body.contains(e.target))
  }, { passive: true })

  sheet.addEventListener('touchmove', e => {
    if (ignoreTouch || decidedScroll) return
    const dy = e.touches[0].clientY - startY

    if (!dragging) {
      if (Math.abs(dy) < 6) return

      // When collapsed: always drag the sheet (no body scrolling)
      if (!isExpanded) {
        dragging = true
        if (body) body.style.overflowY = 'hidden'
        sheet.style.transition = 'none'
        // Blur focused input so keyboard doesn't interfere with drag
        if (touchOnInteractive) document.activeElement?.blur?.()
      }
      // When expanded and touch in body:
      else if (touchInBody) {
        if (dy <= 0) { decidedScroll = true; return } // scrolling up — let browser
        if (body.scrollTop > 1) { decidedScroll = true; return } // not at top — let browser
        // At top and dragging down → hijack as sheet drag
        dragging = true
        if (body) body.style.overflowY = 'hidden'
        sheet.style.transition = 'none'
      }
      // Expanded but touch outside body (handle, tabs, search area)
      else {
        dragging = true
        if (body) body.style.overflowY = 'hidden'
        sheet.style.transition = 'none'
        if (touchOnInteractive) document.activeElement?.blur?.()
      }
    }

    e.preventDefault()

    // Clamp direction: expanded only drags down, collapsed only drags up
    let clampedDy = dy
    if (isExpanded && dy < 0) clampedDy = 0
    if (!isExpanded && dy > 0) clampedDy = 0

    // Rubber-band dampening
    const dampened = clampedDy > 0
      ? Math.min(clampedDy, clampedDy * 0.5 + 30)
      : Math.max(clampedDy, clampedDy * 0.5 - 30)

    sheet.style.transform = isExpanded
      ? `translateY(${dampened}px)`
      : `translateY(calc(100% - 140px - var(--safe-bottom) + ${dampened}px))`
  }, { passive: false })

  sheet.addEventListener('touchend', e => {
    if (ignoreTouch) { ignoreTouch = false; return }

    // Re-enable body scroll and CSS transition
    if (body) body.style.overflowY = ''
    sheet.style.transition = ''
    sheet.style.transform = ''

    if (!dragging) {
      // Tap on interactive element when collapsed — let browser handle (focus input, etc.)
      if (touchOnInteractive) { touchOnInteractive = false; return }
      // Tap on handle toggles
      if (e.target.closest('.sheet-handle')) toggle()
      return
    }

    dragging = false
    touchOnInteractive = false
    const dy = e.changedTouches[0].clientY - startY
    const elapsed = Date.now() - startTime
    const velocity = Math.abs(dy) / elapsed // px/ms

    // Fast swipe — follow direction
    if (velocity > 0.3) {
      if (dy > 0) collapse()
      else expand()
      return
    }

    // Slow drag — snap based on distance
    if (dy > 60) collapse()
    else if (dy < -60) expand()
    // else: small movement, return to previous state
  }, { passive: true })

  // --- Mouse events (desktop) ---
  let mouseStartY = 0
  let mouseDragging = false

  function onMouseDown(e) {
    if (isInteractive(e.target)) return
    mouseStartY = e.clientY
    mouseDragging = false
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    e.preventDefault() // prevent text selection
  }

  function onMouseMove(e) {
    const dy = e.clientY - mouseStartY
    if (!mouseDragging && Math.abs(dy) > 5) {
      mouseDragging = true
      sheet.style.transition = 'none'
    }
    if (!mouseDragging) return

    const dampened = dy > 0
      ? Math.min(dy, dy * 0.5 + 30)
      : Math.max(dy, dy * 0.5 - 30)

    sheet.style.transform = isExpanded
      ? `translateY(${dampened}px)`
      : `translateY(calc(100% - 140px - var(--safe-bottom) + ${dampened}px))`
  }

  function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    sheet.style.transition = ''
    sheet.style.transform = ''

    if (!mouseDragging) {
      if (e.target.closest('.sheet-handle')) toggle()
      return
    }
    mouseDragging = false

    const dy = e.clientY - mouseStartY
    if (dy > 60) collapse()
    else if (dy < -60) expand()
  }

  sheet.addEventListener('mousedown', onMouseDown)

  sheet._cleanup = () => {
    sheet.removeEventListener('mousedown', onMouseDown)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
})

onBeforeUnmount(() => {
  sheetEl.value?._cleanup?.()
})

defineExpose({ expand, collapse, toggle })
</script>

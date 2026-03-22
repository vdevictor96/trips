<template>
  <div id="love-footer" @click="handleClick">Powered by love of Víctor &lt;4</div>
</template>

<script setup>
const HEART_BURST_COLORS = ['#ff4f8a','#ff6ca7','#ff9f45','#ffd166','#8bd3ff','#8e9bff','#c27bff','#7bd88f']
let footerClickTimestamps = []
let lastFooterBurstAt = 0

function spawnFloatingHeart(opts) {
  const h = document.createElement('div')
  h.className = 'floating-heart'
  h.textContent = '\u2665'
  h.style.left = opts.x + 'px'
  h.style.top = opts.y + 'px'
  h.style.color = opts.color
  h.style.fontSize = opts.sizeRem + 'rem'
  h.style.animationDuration = opts.durationMs + 'ms'
  h.style.setProperty('--heart-dx', opts.driftX + 'px')
  h.style.setProperty('--heart-rise', opts.rise + 'px')
  h.style.setProperty('--heart-rot', opts.rotate + 'deg')
  h.addEventListener('animationend', () => h.remove())
  document.body.appendChild(h)
}

function handleClick() {
  const footer = document.getElementById('love-footer')
  const rect = footer.getBoundingClientRect()
  // Single heart
  spawnFloatingHeart({
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + 4),
    color: '#db4f80',
    sizeRem: 1.35,
    driftX: (Math.random() * 90) - 75,
    rise: Math.max(Math.floor(window.innerHeight * 0.65), 320),
    rotate: (Math.random() * 28) - 14,
    durationMs: 1400,
  })
  // Check for rapid-click burst
  const now = Date.now()
  footerClickTimestamps.push(now)
  footerClickTimestamps = footerClickTimestamps.filter(ts => now - ts <= 1800)
  if (footerClickTimestamps.length >= 5 && now - lastFooterBurstAt > 1200) {
    lastFooterBurstAt = now
    footerClickTimestamps = []
    for (let i = 0; i < 48; i++) {
      setTimeout(() => {
        let x = i < 16
          ? rect.left + rect.width / 2 + (Math.random() * 240 - 120)
          : Math.random() * window.innerWidth
        x = Math.max(10, Math.min(window.innerWidth - 10, x))
        spawnFloatingHeart({
          x: Math.round(x),
          y: Math.round(window.innerHeight - (Math.random() * 70 + 8)),
          color: HEART_BURST_COLORS[Math.floor(Math.random() * HEART_BURST_COLORS.length)],
          sizeRem: 0.8 + Math.random() * 1.1,
          driftX: (Math.random() * 220) - 110,
          rise: Math.floor(window.innerHeight * (0.55 + Math.random() * 0.45)),
          rotate: (Math.random() * 50) - 25,
          durationMs: 1000 + Math.floor(Math.random() * 900),
        })
      }, Math.floor(Math.random() * 420))
    }
  }
}
</script>

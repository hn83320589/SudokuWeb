<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const particles: Particle[] = []

const colors = [
  '#818cf8', '#6366f1', '#4f46e5', // indigo
  '#38bdf8', '#0ea5e9', '#0284c7', // sky
  '#a78bfa', '#8b5cf6', '#7c3aed', // violet
  '#34d399', '#10b981', '#059669', // emerald
]

function createBurst(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3
    const speed = 2 + Math.random() * 4
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 60 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: 2 + Math.random() * 2,
    })
  }
}

function animate() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !canvas.value) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.04 // gravity
    p.vx *= 0.99
    p.life--

    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()

    if (p.life <= 0) {
      particles.splice(i, 1)
    }
  }

  ctx.globalAlpha = 1
  animId = requestAnimationFrame(animate)
}

function launchFireworks() {
  if (!canvas.value) return
  const w = canvas.value.width
  const h = canvas.value.height
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createBurst(
        w * 0.2 + Math.random() * w * 0.6,
        h * 0.2 + Math.random() * h * 0.4,
        40 + Math.floor(Math.random() * 30)
      )
    }, i * 400)
  }
}

function resize() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  animate()
  launchFireworks()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  particles.length = 0
})
</script>

<template>
  <canvas
    ref="canvas"
    class="fixed inset-0 pointer-events-none z-50"
  />
</template>

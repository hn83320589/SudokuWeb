<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  text?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null
let launchTimer: ReturnType<typeof setTimeout> | null = null
let startTime = 0

// --- Phase config ---
const FIREWORK_DURATION = 7500   // ms of fireworks (continues during text phase)
const TEXT_GATHER_START = 3500   // ms when text particles begin gathering
const TEXT_GATHER_DURATION = 1500 // ms to fully converge

// --- Firework types ---
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  trail: { x: number; y: number; alpha: number }[]
  sparkle: boolean
  secondary: boolean
}

interface Rocket {
  x: number
  y: number
  vy: number
  targetY: number
  color: string
  trail: { x: number; y: number; alpha: number }[]
  exploded: boolean
}

interface TextParticle {
  x: number
  y: number
  targetX: number
  targetY: number
  startX: number
  startY: number
  color: string
  size: number
  delay: number // 0~1, staggered start
  settled: boolean
}

const particles: Particle[] = []
const rockets: Rocket[] = []
const textParticles: TextParticle[] = []
let textPhaseStarted = false

const palettes = [
  ['#818cf8', '#6366f1', '#4f46e5', '#a5b4fc'],
  ['#38bdf8', '#0ea5e9', '#0284c7', '#7dd3fc'],
  ['#a78bfa', '#8b5cf6', '#7c3aed', '#c4b5fd'],
  ['#34d399', '#10b981', '#059669', '#6ee7b7'],
  ['#fb923c', '#f97316', '#ea580c', '#fdba74'],
  ['#f472b6', '#ec4899', '#db2777', '#f9a8d4'],
  ['#fbbf24', '#f59e0b', '#d97706', '#fde68a'],
  ['#f87171', '#ef4444', '#dc2626', '#fca5a5'],
]

const textColors = ['#fbbf24', '#f59e0b', '#fde68a', '#fcd34d', '#ffffff']

function pickPalette(): string[] {
  return palettes[Math.floor(Math.random() * palettes.length)]!
}

// --- Text sampling ---
function sampleTextPixels(
  text: string,
  canvasW: number,
  canvasH: number,
  density: number,
): { x: number; y: number }[] {
  const offscreen = document.createElement('canvas')
  const fontSize = Math.min(canvasW / (text.length * 1.2), canvasH * 0.18, 120)
  // Make offscreen large enough
  offscreen.width = canvasW
  offscreen.height = canvasH
  const ctx = offscreen.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasW, canvasH)
  ctx.font = `bold ${fontSize}px "Noto Sans TC", "Hiragino Sans", "Microsoft JhengHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, canvasW / 2, canvasH * 0.45)

  const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
  const points: { x: number; y: number }[] = []
  const step = Math.max(2, Math.round(1 / density))

  for (let y = 0; y < canvasH; y += step) {
    for (let x = 0; x < canvasW; x += step) {
      const idx = (y * canvasW + x) * 4
      if (imageData.data[idx]! > 128) {
        points.push({ x, y })
      }
    }
  }

  return points
}

function initTextParticles(canvasW: number, canvasH: number) {
  const text = props.text || '恭喜通關'
  const points = sampleTextPixels(text, canvasW, canvasH, 0.4)

  // Limit particle count for performance
  const maxParticles = 2000
  const step = points.length > maxParticles ? Math.ceil(points.length / maxParticles) : 1

  for (let i = 0; i < points.length; i += step) {
    const p = points[i]!
    // Start from random edge positions
    const edge = Math.random()
    let startX: number, startY: number
    if (edge < 0.25) {
      startX = Math.random() * canvasW
      startY = -20
    } else if (edge < 0.5) {
      startX = Math.random() * canvasW
      startY = canvasH + 20
    } else if (edge < 0.75) {
      startX = -20
      startY = Math.random() * canvasH
    } else {
      startX = canvasW + 20
      startY = Math.random() * canvasH
    }

    textParticles.push({
      x: startX,
      y: startY,
      targetX: p.x,
      targetY: p.y,
      startX,
      startY,
      color: textColors[Math.floor(Math.random() * textColors.length)]!,
      size: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 0.4,
      settled: false,
    })
  }
}

// --- Firework logic ---
function createExplosion(x: number, y: number, palette: string[], count: number, secondary: boolean) {
  const rings = secondary ? 1 : 2
  for (let ring = 0; ring < rings; ring++) {
    const ringCount = ring === 0 ? count : Math.floor(count * 0.4)
    const speedBase = ring === 0 ? 3 : 1.5
    const speedRange = ring === 0 ? 5 : 2.5
    for (let i = 0; i < ringCount; i++) {
      const angle = (Math.PI * 2 * i) / ringCount + (Math.random() - 0.5) * 0.4
      const speed = speedBase + Math.random() * speedRange
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 70 + Math.random() * 50,
        maxLife: 70 + Math.random() * 50,
        color: palette[Math.floor(Math.random() * palette.length)]!,
        size: secondary ? 1.5 + Math.random() * 1 : 2 + Math.random() * 2.5,
        trail: [],
        sparkle: Math.random() < 0.3,
        secondary,
      })
    }
  }
}

function launchRocket(w: number, h: number) {
  const x = w * 0.15 + Math.random() * w * 0.7
  const palette = pickPalette()
  rockets.push({
    x,
    y: h,
    vy: -(8 + Math.random() * 5),
    targetY: h * 0.1 + Math.random() * h * 0.35,
    color: palette[0]!,
    trail: [],
    exploded: false,
  })
}

function scheduleLaunches(w: number, h: number, duration: number) {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => launchRocket(w, h), i * 200)
  }

  let elapsed = 600
  function scheduleNext() {
    if (elapsed >= duration) return
    // After text phase starts, launch less frequently
    const inTextPhase = elapsed >= TEXT_GATHER_START
    const delay = inTextPhase
      ? 800 + Math.random() * 1200
      : 300 + Math.random() * 600
    elapsed += delay
    launchTimer = setTimeout(() => {
      launchRocket(w, h)
      if (!inTextPhase && Math.random() < 0.3) {
        setTimeout(() => launchRocket(w, h), 100)
      }
      scheduleNext()
    }, delay)
  }
  scheduleNext()
}

// --- Easing ---
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// --- Main animation ---
function animate() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !canvas.value) return

  const w = canvas.value.width
  const h = canvas.value.height
  const elapsed = performance.now() - startTime

  // Fade trail
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  ctx.fillRect(0, 0, w, h)

  // --- Firework rockets ---
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]!
    r.trail.push({ x: r.x, y: r.y, alpha: 1 })
    if (r.trail.length > 12) r.trail.shift()

    r.y += r.vy
    r.vy *= 0.98
    r.x += (Math.random() - 0.5) * 0.8

    for (let t = 0; t < r.trail.length; t++) {
      const tp = r.trail[t]!
      tp.alpha *= 0.85
      ctx.globalAlpha = tp.alpha * 0.6
      ctx.fillStyle = r.color
      ctx.beginPath()
      ctx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(r.x, r.y, 2, 0, Math.PI * 2)
    ctx.fill()

    if (r.y <= r.targetY && !r.exploded) {
      r.exploded = true
      const palette = pickPalette()
      const count = 50 + Math.floor(Math.random() * 40)
      createExplosion(r.x, r.y, palette, count, false)
      rockets.splice(i, 1)
    }
  }

  // --- Firework particles ---
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!

    if (!p.secondary) {
      p.trail.push({ x: p.x, y: p.y, alpha: p.life / p.maxLife })
      if (p.trail.length > 5) p.trail.shift()
    }

    p.x += p.vx
    p.y += p.vy
    p.vy += 0.03
    p.vx *= 0.985
    p.vy *= 0.985
    p.life--

    const progress = p.life / p.maxLife
    const alpha = progress > 0.3 ? 1 : progress / 0.3

    if (!p.secondary) {
      for (let t = 0; t < p.trail.length; t++) {
        const tp = p.trail[t]!
        ctx.globalAlpha = (t / p.trail.length) * alpha * 0.3
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(tp.x, tp.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = p.sparkle && Math.random() > 0.5 ? 12 : 4
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * Math.max(0.3, progress), 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    if (!p.secondary && p.life <= 5 && Math.random() < 0.06) {
      createExplosion(p.x, p.y, [p.color], 8 + Math.floor(Math.random() * 6), true)
    }

    if (p.life <= 0) {
      particles.splice(i, 1)
    }
  }

  // --- Text particle phase ---
  if (elapsed >= TEXT_GATHER_START && !textPhaseStarted) {
    textPhaseStarted = true
    initTextParticles(w, h)
  }

  if (textPhaseStarted) {
    const textElapsed = elapsed - TEXT_GATHER_START
    const gatherProgress = Math.min(1, textElapsed / TEXT_GATHER_DURATION)

    for (const tp of textParticles) {
      // Staggered animation per particle
      const particleProgress = Math.max(0, Math.min(1, (gatherProgress - tp.delay) / (1 - tp.delay)))
      const eased = easeOutCubic(particleProgress)

      tp.x = tp.startX + (tp.targetX - tp.startX) * eased
      tp.y = tp.startY + (tp.targetY - tp.startY) * eased
      tp.settled = particleProgress >= 1

      // Sparkle when settled
      const shimmer = tp.settled ? 0.7 + Math.sin(elapsed * 0.005 + tp.targetX * 0.1) * 0.3 : 1
      const alpha = particleProgress < 0.1 ? particleProgress / 0.1 : 1

      ctx.globalAlpha = alpha * shimmer
      ctx.fillStyle = tp.color
      ctx.shadowColor = tp.color
      ctx.shadowBlur = tp.settled && Math.random() > 0.7 ? 8 : 3
      ctx.beginPath()
      ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  ctx.globalAlpha = 1
  animId = requestAnimationFrame(animate)
}

function resize() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  startTime = performance.now()

  const ctx = canvas.value?.getContext('2d')
  if (ctx && canvas.value) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }

  animate()
  scheduleLaunches(canvas.value!.width, canvas.value!.height, FIREWORK_DURATION)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (launchTimer) clearTimeout(launchTimer)
  window.removeEventListener('resize', resize)
  particles.length = 0
  rockets.length = 0
  textParticles.length = 0
  textPhaseStarted = false
})
</script>

<template>
  <canvas
    ref="canvas"
    class="fixed inset-0 pointer-events-none z-50"
  />
</template>

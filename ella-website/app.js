const stage = document.querySelector('#ella-heard-demo')
const canvas = document.querySelector('#snow-canvas')
const context = canvas.getContext('2d')
const carousel = document.querySelector('#carousel')
const carouselContainer = document.querySelector('#carousel-container')
const items = [...document.querySelectorAll('.carousel-item')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

let flakes = []
let stageVisible = true

function resizeSnow() {
  const bounds = stage.getBoundingClientRect()
  const scale = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(bounds.width * scale)
  canvas.height = Math.round(bounds.height * scale)
  canvas.style.width = `${bounds.width}px`
  canvas.style.height = `${bounds.height}px`
  context.setTransform(scale, 0, 0, scale, 0, 0)
  flakes = Array.from({ length: Math.max(18, Math.round(bounds.width / 28)) }, () => ({
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
    size: 1 + Math.random() * 2.5,
    speed: 0.2 + Math.random() * 0.55,
    sway: Math.random() * Math.PI * 2,
  }))
}

function drawSnow(time) {
  if (!reducedMotion.matches && stageVisible) {
    const bounds = stage.getBoundingClientRect()
    context.clearRect(0, 0, bounds.width, bounds.height)
    context.fillStyle = 'rgba(255, 255, 255, .72)'
    flakes.forEach((flake) => {
      flake.y += flake.speed
      flake.x += Math.sin(time / 1200 + flake.sway) * 0.18
      if (flake.y > bounds.height + flake.size) {
        flake.y = -flake.size
        flake.x = Math.random() * bounds.width
      }
      context.beginPath()
      context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
      context.fill()
    })
  }
  requestAnimationFrame(drawSnow)
}

const stageObserver = new IntersectionObserver(([entry]) => {
  stageVisible = entry.isIntersecting
}, { threshold: 0.05 })

stageObserver.observe(stage)
window.addEventListener('resize', resizeSnow)
resizeSnow()
requestAnimationFrame(drawSnow)

function parallax(clientX, clientY) {
  const bounds = stage.getBoundingClientRect()
  const x = (clientX - bounds.left) / bounds.width - 0.5
  const y = (clientY - bounds.top) / bounds.height - 0.5
  stage.style.setProperty('--parallax-x', x.toFixed(3))
  stage.style.setProperty('--parallax-y', y.toFixed(3))
}

stage.addEventListener('pointermove', (event) => parallax(event.clientX, event.clientY))
stage.addEventListener('pointerleave', () => {
  stage.style.setProperty('--parallax-x', '0')
  stage.style.setProperty('--parallax-y', '0')
})

const step = 360 / items.length
const radius = 300
let angle = 0
let velocity = 0
let pointerX = 0
let dragging = false
let previousTime = performance.now()

items.forEach((item, index) => {
  item.style.transform = `translate(-50%, -50%) rotateY(${step * index}deg) translateZ(${radius}px)`
})

function renderCarousel() {
  carousel.style.transform = `rotateY(${angle}deg)`
}

function animateCarousel(time) {
  const elapsed = Math.min(32, time - previousTime)
  previousTime = time
  if (!dragging && !reducedMotion.matches) {
    velocity *= Math.pow(0.92, elapsed / 16)
    angle += velocity * elapsed / 16
    if (Math.abs(velocity) < 0.01) {
      const target = Math.round(angle / step) * step
      angle += (target - angle) * 0.08
    }
    renderCarousel()
  }
  requestAnimationFrame(animateCarousel)
}

carouselContainer.addEventListener('pointerdown', (event) => {
  dragging = true
  pointerX = event.clientX
  velocity = 0
  carouselContainer.setPointerCapture(event.pointerId)
})

carouselContainer.addEventListener('pointermove', (event) => {
  if (!dragging) return
  const delta = event.clientX - pointerX
  pointerX = event.clientX
  velocity = delta * 0.18
  angle += velocity
  renderCarousel()
})

function releaseCarousel() {
  dragging = false
}

carouselContainer.addEventListener('pointerup', releaseCarousel)
carouselContainer.addEventListener('pointercancel', releaseCarousel)
requestAnimationFrame(animateCarousel)
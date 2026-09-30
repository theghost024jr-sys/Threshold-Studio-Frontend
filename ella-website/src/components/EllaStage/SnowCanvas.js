export function initializeSnowCanvas(canvas) {
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const context = canvas.getContext('2d')
  const flakes = Array.from({ length: 84 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 0.8 + Math.random() * 2.2,
    fall: 0.00018 + Math.random() * 0.00055,
    sway: Math.random() * Math.PI * 2,
    drift: 0.0006 + Math.random() * 0.0014,
  }))
  let frame = 0
  let width = 0
  let height = 0

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  const paint = (time) => {
    context.clearRect(0, 0, width, height)
    context.fillStyle = 'rgba(255, 255, 255, 0.78)'
    for (const flake of flakes) {
      flake.y += flake.fall * height
      flake.x += Math.sin(time * flake.drift + flake.sway) * 0.00055
      if (flake.y > height + 4) {
        flake.y = -4
        flake.x = Math.random() * width
      }
      if (flake.x > width + 4) flake.x = -4
      if (flake.x < -4) flake.x = width + 4
      context.beginPath()
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
      context.fill()
    }
    frame = requestAnimationFrame(paint)
  }

  resize()
  window.addEventListener('resize', resize)
  frame = requestAnimationFrame(paint)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
  }
}

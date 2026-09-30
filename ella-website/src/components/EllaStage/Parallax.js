export function attachParallax(stage) {
  if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const move = (event) => {
    const bounds = stage.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    stage.style.setProperty('--pointer-x', x.toFixed(3))
    stage.style.setProperty('--pointer-y', y.toFixed(3))
  }
  const leave = () => {
    stage.style.setProperty('--pointer-x', '0')
    stage.style.setProperty('--pointer-y', '0')
  }

  stage.addEventListener('pointermove', move)
  stage.addEventListener('pointerleave', leave)
  return () => {
    stage.removeEventListener('pointermove', move)
    stage.removeEventListener('pointerleave', leave)
  }
}

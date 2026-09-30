export function initializeMicroAnimations(stage) {
  if (!stage) return () => {}

  const observer = new IntersectionObserver(([entry]) => {
    stage.dataset.active = String(entry.isIntersecting)
  }, { threshold: 0.12 })

  stage.dataset.ready = 'true'
  observer.observe(stage)
  return () => observer.disconnect()
}

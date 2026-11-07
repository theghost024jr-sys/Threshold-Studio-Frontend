import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

function flower(scene, x, z, scale, phase) {
  const bloom = new THREE.Group()
  const petalMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.98 + (phase % 3) * 0.012, 0.65, 0.53), roughness: 0.58, side: THREE.DoubleSide })
  const coreMaterial = new THREE.MeshStandardMaterial({ color: '#4d2633', emissive: '#7c3640', emissiveIntensity: 0.18, roughness: 0.8 })
  const petalGeometry = new THREE.SphereGeometry(0.42 * scale, 10, 7)
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI * 2 * index) / 6
    const petal = new THREE.Mesh(petalGeometry, petalMaterial)
    petal.position.set(Math.cos(angle) * 0.46 * scale, 0.06, Math.sin(angle) * 0.46 * scale)
    petal.scale.set(0.72, 0.25, 1.22)
    petal.rotation.y = -angle
    bloom.add(petal)
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 12, 8), coreMaterial)
  bloom.add(core)
  bloom.position.set(x, 0.12 + scale * 0.08, z)
  bloom.userData = { phase, baseX: x, baseZ: z }
  scene.add(bloom)
  return bloom
}

export default function WildflowerDrift() {
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const draggingRef = useRef(false)
  const starfishRef = useRef({ x: 78, y: 76 })
  const [starfish, setStarfish] = useState({ x: 78, y: 76 })
  const [foundSeam, setFoundSeam] = useState(false)

  const moveStarfish = (event) => {
    if (!draggingRef.current || foundSeam) return
    const rect = pageRef.current.getBoundingClientRect()
    const x = Math.max(2, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(2, Math.min(91, ((event.clientY - rect.top) / rect.height) * 100))
    starfishRef.current = { x, y }
    setStarfish({ x, y })
  }

  const placeStarfish = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (starfishRef.current.x < 18 && starfishRef.current.y < 22) setFoundSeam(true)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const page = pageRef.current
    if (!canvas || !page) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#a9c5c6')
    scene.fog = new THREE.Fog('#a9c5c6', 13, 54)
    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 100)
    camera.position.set(0, 5.2, 12)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene.add(new THREE.HemisphereLight('#fff0cb', '#304d34', 2.8))
    const sun = new THREE.DirectionalLight('#ffd29d', 2.4)
    sun.position.set(-8, 14, 8)
    scene.add(sun)

    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(72, 72, 30, 30),
      new THREE.MeshStandardMaterial({ color: '#547842', roughness: 1 })
    )
    field.rotation.x = -Math.PI / 2
    const position = field.geometry.attributes.position
    for (let index = 0; index < position.count; index += 1) {
      position.setZ(index, position.getZ(index) + Math.sin(position.getX(index) * 0.45) * 0.3 + Math.cos(position.getY(index) * 0.36) * 0.35)
    }
    position.needsUpdate = true
    field.geometry.computeVertexNormals()
    scene.add(field)

    const flowers = []
    for (let index = 0; index < 90; index += 1) {
      const angle = index * 2.399
      const radius = 2.5 + Math.sqrt(index) * 1.32
      flowers.push(flower(scene, Math.cos(angle) * radius, Math.sin(angle) * radius - 4, 0.5 + (index % 5) * 0.08, index * 0.47))
    }

    const driftGeometry = new THREE.BufferGeometry()
    const driftPoints = new Float32Array(360)
    for (let index = 0; index < 120; index += 1) {
      driftPoints[index * 3] = (Math.random() - 0.5) * 28
      driftPoints[index * 3 + 1] = Math.random() * 8 + 0.3
      driftPoints[index * 3 + 2] = (Math.random() - 0.5) * 30 - 6
    }
    driftGeometry.setAttribute('position', new THREE.BufferAttribute(driftPoints, 3))
    const drift = new THREE.Points(driftGeometry, new THREE.PointsMaterial({ color: '#fff2ca', size: 0.11, transparent: true, opacity: 0.78, sizeAttenuation: true }))
    scene.add(drift)

    const pointer = { x: 0, y: 0 }
    const onMove = (event) => {
      const rect = page.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }
    page.addEventListener('pointermove', onMove)
    const resize = () => {
      const { width, height } = page.getBoundingClientRect()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(page)
    let frame
    const clock = new THREE.Clock()
    const animate = () => {
      const elapsed = clock.getElapsedTime()
      flowers.forEach((bloom) => {
        bloom.rotation.z = Math.sin(elapsed * 1.1 + bloom.userData.phase) * 0.14
        bloom.rotation.x = Math.cos(elapsed * 0.7 + bloom.userData.phase) * 0.08
      })
      drift.rotation.y = elapsed * 0.026
      drift.position.x = Math.sin(elapsed * 0.2) * 1.4
      camera.position.x += (pointer.x * 2.1 - camera.position.x) * 0.025
      camera.position.y += (5.2 - pointer.y * 0.8 - camera.position.y) * 0.025
      camera.lookAt(pointer.x * 1.8, 0.1, -6)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      page.removeEventListener('pointermove', onMove)
      field.geometry.dispose()
      field.material.dispose()
      driftGeometry.dispose()
      drift.material.dispose()
      renderer.dispose()
    }
  }, [])

  return <main className={`wildflower-drift-portal${foundSeam ? ' wildflower-drift-portal--seam-found' : ''}`} ref={pageRef} onPointerMove={moveStarfish} onPointerUp={placeStarfish}>
    <canvas ref={canvasRef} aria-hidden="true" />
    <header><Link to="/">Return to Portal</Link><span>Ephemeral Field · Mist / Air boundary</span></header>
    <div className="wildflower-drift-portal__seam" aria-hidden="true">mist seam</div>
    {!foundSeam && <button
      className="wildflower-drift-portal__starfish"
      type="button"
      aria-label="Drag the starfish through the field"
      style={{ left: `${starfish.x}%`, top: `${starfish.y}%` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        draggingRef.current = true
      }}
    ><span>starfish</span></button>}
    <section className="wildflower-drift-portal__copy">
      <p>Wildflower Drift</p>
      <h1>The field holds without closing.</h1>
      <p>Walk the drift. Poppies hold the visible memory; seeds carry what can move without becoming loss.</p>
      <small>Move through the field to shift the view. Nothing here is collected or changed.</small>
      {foundSeam && <small className="wildflower-drift-portal__answer">The field remembers a sea it never was.</small>}
      {foundSeam && <a className="wildflower-drift-portal__next" href="/wildflower-drift.html">Continue the drift</a>}
    </section>
  </main>
}

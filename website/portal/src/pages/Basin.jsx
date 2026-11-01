import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import WorldThread from '../components/WorldThread.jsx'
import { getVaultDocument, vaultSummary } from '../modules/vault.js'

const basinRecord = getVaultDocument('basin')
const basinSummary = vaultSummary(basinRecord)
const relationships = [
  {
    id: 'take',
    label: 'Take',
    action: 'Use what the Basin offers.',
    response: 'Provision becomes clearer: usable water and work leave the lower works.'
  },
  {
    id: 'tend',
    label: 'Tend',
    action: 'Restore, clear, return, or maintain part of the flow.',
    response: 'Function becomes clearer: aqueduct, wheel, flow, and terrain work as one system.'
  },
  {
    id: 'wait',
    label: 'Wait',
    action: 'Remain beside the machinery long enough to observe.',
    response: 'Slower signs become clearer: water timing, light, birds, and moss.'
  }
]

function terrainHeight(x, z) {
  const slope = Math.max(0, (12 - z) * 0.26)
  const basin = -1.15 * Math.exp(-((x * x) / 85 + ((z - 18) * (z - 18)) / 34))
  const variation = Math.sin(x * 0.38) * 0.32 + Math.cos(z * 0.25) * 0.24
  return slope + basin + variation
}

function addBox(scene, size, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  scene.add(mesh)
  return mesh
}

function createCabin(scene, position) {
  const wood = new THREE.MeshStandardMaterial({ color: '#584a31', roughness: 0.94 })
  const roof = new THREE.MeshStandardMaterial({ color: '#21362b', roughness: 0.9 })
  const warm = new THREE.MeshStandardMaterial({ color: '#cf8c42', emissive: '#7d3e16', emissiveIntensity: 1.1 })
  const [x, y, z] = position

  addBox(scene, [7, 4.2, 5.2], [x, y + 2.1, z], wood)
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(5.35, 3.2, 4), roof)
  roofMesh.position.set(x, y + 5.6, z)
  roofMesh.rotation.y = Math.PI / 4
  scene.add(roofMesh)
  addBox(scene, [8.8, 0.35, 2.6], [x, y + 0.35, z + 3.7], wood)
  addBox(scene, [0.2, 2.7, 0.2], [x - 3.6, y + 1.45, z + 4.6], wood)
  addBox(scene, [0.2, 2.7, 0.2], [x + 3.6, y + 1.45, z + 4.6], wood)
  addBox(scene, [1.1, 1.25, 0.08], [x - 1.7, y + 2.55, z + 2.64], warm)
  addBox(scene, [1.1, 1.25, 0.08], [x + 1.7, y + 2.55, z + 2.64], warm)
}

function createHydrowheel(scene, position) {
  const wheel = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({ color: '#4b3522', roughness: 0.88 })
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.8, 16), wood)
  hub.rotation.x = Math.PI / 2
  wheel.add(hub)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.16, 8, 28), wood)
  wheel.add(rim)
  for (let index = 0; index < 10; index += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.1, 0.18), wood)
    spoke.rotation.z = (Math.PI * 2 * index) / 10
    wheel.add(spoke)
  }
  for (let index = 0; index < 8; index += 1) {
    const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.32), wood)
    const angle = (Math.PI * 2 * index) / 8
    bucket.position.set(Math.cos(angle) * 2.12, Math.sin(angle) * 2.12, 0)
    bucket.rotation.z = angle
    wheel.add(bucket)
  }

  wheel.position.set(...position)
  scene.add(wheel)
  return wheel
}

export default function Basin() {
  const pageRef = useRef(null)
  const canvasRef = useRef(null)
  const soundRef = useRef(null)
  const journeyProgressRef = useRef(0)
  const [relationship, setRelationship] = useState(null)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [soundError, setSoundError] = useState('')
  const response = relationships.find((choice) => choice.id === relationship)

  useEffect(() => {
    const page = pageRef.current
    const canvas = canvasRef.current
    if (!page || !canvas) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#10211b')
    scene.fog = new THREE.Fog('#10211b', 48, 96)

    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 150)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor('#10211b', 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene.add(new THREE.HemisphereLight('#a9d8bd', '#182018', 2.4))
    const sun = new THREE.DirectionalLight('#f0d7a4', 2.7)
    sun.position.set(-18, 30, 18)
    sun.castShadow = true
    scene.add(sun)

    const terrainMaterial = new THREE.MeshStandardMaterial({ color: '#4e794a', roughness: 0.96, metalness: 0 })
    const terrainGeometry = new THREE.PlaneGeometry(64, 86, 64, 86)
    terrainGeometry.rotateX(-Math.PI / 2)
    const terrainPositions = terrainGeometry.attributes.position
    for (let index = 0; index < terrainPositions.count; index += 1) {
      terrainPositions.setY(index, terrainHeight(terrainPositions.getX(index), terrainPositions.getZ(index)))
    }
    terrainPositions.needsUpdate = true
    terrainGeometry.computeVertexNormals()
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
    terrain.receiveShadow = true
    scene.add(terrain)

    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(7.7, 48),
      new THREE.MeshStandardMaterial({ color: '#4a9b94', roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.9 })
    )
    pond.rotation.x = -Math.PI / 2
    pond.position.set(0, -0.92, 18)
    scene.add(pond)

    const stone = new THREE.MeshStandardMaterial({ color: '#8a8e79', roughness: 0.98 })
    const wood = new THREE.MeshStandardMaterial({ color: '#79502c', roughness: 0.9 })
    const water = new THREE.MeshStandardMaterial({ color: '#63ada5', roughness: 0.32, metalness: 0.08 })
    const glintMaterial = new THREE.MeshBasicMaterial({ color: '#d8f1cc', transparent: true, opacity: 0.48 })
    const waterGlints = new THREE.Group()
    for (let index = 0; index < 6; index += 1) {
      const glint = new THREE.Mesh(new THREE.CircleGeometry(0.16 + (index % 2) * 0.09, 8), glintMaterial)
      glint.rotation.x = -Math.PI / 2
      glint.position.set(
        -3.8 + (index % 3) * 3.2,
        -0.89,
        15.8 + Math.floor(index / 3) * 3.1
      )
      waterGlints.add(glint)
    }
    scene.add(waterGlints)

    const upperPath = [[9.5, -4], [9.3, -7.2], [6.8, -10.2], [4.1, -12.8], [2.1, -15.2]]
    const lowerPath = [[8.2, 1.8], [9.4, 5], [7, 8.3], [4, 11.6], [1.1, 15]]
    const trailStones = [...upperPath, ...lowerPath]
    trailStones.forEach(([x, z], index) => {
      const y = terrainHeight(x, z)
      addBox(scene, [2.1, 0.22, 1.05], [x, y + 0.12, z], stone, [0, (index % 2 ? 0.42 : -0.3), 0])
    })

    const wheelPosition = [-6.4, terrainHeight(-6.4, 5) + 2.3, 5]
    const wheel = createHydrowheel(scene, wheelPosition)
    addBox(scene, [2.4, 2.5, 2.6], [-3.6, terrainHeight(-3.6, 4) + 1.25, 4], stone)
    const aqueductSegments = [9.5, 6.5, 3.5, 0.5]
    aqueductSegments.forEach((z) => {
      const channelY = terrainHeight(-7.1, z) + 3
      addBox(scene, [2.25, 0.28, 3.25], [-7.1, channelY, z], stone)
      addBox(scene, [0.16, 0.54, 3.25], [-8.08, channelY + 0.28, z], stone)
      addBox(scene, [0.16, 0.54, 3.25], [-6.12, channelY + 0.28, z], stone)
      addBox(scene, [1.58, 0.09, 3.08], [-7.1, channelY + 0.2, z], water)
      const supportHeight = channelY - terrainHeight(-7.1, z)
      addBox(scene, [0.68, supportHeight, 0.68], [-7.1, terrainHeight(-7.1, z) + supportHeight / 2, z], stone)
    })

    for (let index = 0; index < 12; index += 1) {
      const z = 2.5 - index * 1.55
      const y = terrainHeight(1.7, z)
      addBox(scene, [3.1, 0.34, 1.1], [1.7, y + 0.22, z], stone)
    }

    const plateauY = terrainHeight(1.7, -18)
    addBox(scene, [15, 1.4, 12], [1.7, plateauY - 0.45, -18], terrainMaterial)
    createCabin(scene, [1.7, plateauY + 0.2, -19])

    for (let index = 0; index < 28; index += 1) {
      const angle = (index / 28) * Math.PI * 2
      const radius = 24 + (index % 5) * 4
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius - 5
      const y = terrainHeight(x, z)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 8 + (index % 4) * 2, 7), wood)
      trunk.position.set(x, y + 4, z)
      trunk.castShadow = true
      scene.add(trunk)
      const crown = new THREE.Mesh(new THREE.ConeGeometry(3 + (index % 3), 9, 7), terrainMaterial)
      crown.position.set(x, y + 10, z)
      scene.add(crown)
    }

    [[7.8, -1.5], [9.2, 3.8], [4.8, 8.7], [-1.4, 11.6]].forEach(([x, z], index) => {
      const y = terrainHeight(x, z)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.58, 9 + index, 7), wood)
      trunk.position.set(x, y + (9 + index) / 2, z)
      trunk.castShadow = true
      scene.add(trunk)
      const crown = new THREE.Mesh(new THREE.ConeGeometry(3.6 + (index % 2), 10, 7), terrainMaterial)
      crown.position.set(x, y + 12.5 + index / 2, z)
      scene.add(crown)
    })

    const birds = new THREE.Group()
    const birdMaterial = new THREE.LineBasicMaterial({ color: '#c6d9bb', transparent: true, opacity: 0.72 })
    for (let index = 0; index < 4; index += 1) {
      const wingSpan = 0.28 + (index % 2) * 0.08
      const bird = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-wingSpan, 0, 0),
          new THREE.Vector3(0, wingSpan * 0.28, 0),
          new THREE.Vector3(wingSpan, 0, 0)
        ]),
        birdMaterial
      )
      bird.position.set(index * 0.62, (index % 2) * 0.25, index * 0.18)
      birds.add(bird)
    }
    birds.position.set(-3.6, terrainHeight(-3.6, 11) + 6.4, 11)
    scene.add(birds)

    const cabinLight = new THREE.PointLight('#d99a51', 28, 20, 2)
    cabinLight.position.set(1.7, plateauY + 4.5, -15.8)
    scene.add(cabinLight)

    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(9.5, plateauY + 6.8, -5),
      new THREE.Vector3(7.5, 9.5, 1),
      new THREE.Vector3(0, 3.5, 28),
      new THREE.Vector3(8, 4.6, 20),
      new THREE.Vector3(4.5, 5.2, 11),
      new THREE.Vector3(-0.5, 6.1, 7),
      new THREE.Vector3(-5, 6.5, 4),
      new THREE.Vector3(-2.5, 8, 0),
      new THREE.Vector3(1.2, 10.5, -8),
      new THREE.Vector3(1.7, plateauY + 5.2, -13.6)
    ], false, 'catmullrom', 0.35)
    const targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.7, plateauY + 2.3, -16),
      new THREE.Vector3(1.7, plateauY + 2.3, -16),
      new THREE.Vector3(0, -0.75, 18),
      new THREE.Vector3(-4.8, terrainHeight(-4.8, 8) + 2.4, 8),
      new THREE.Vector3(-6.4, wheelPosition[1], 5),
      new THREE.Vector3(-6.4, wheelPosition[1], 5),
      new THREE.Vector3(-6.4, wheelPosition[1], 5),
      new THREE.Vector3(1.7, terrainHeight(1.7, -9) + 1.8, -9),
      new THREE.Vector3(1.7, plateauY + 2.3, -16)
    ], false, 'catmullrom', 0.35)

    let active = true
    let displayedProgress = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)
    }

    const updateJourney = () => {
      const bounds = page.getBoundingClientRect()
      const travel = Math.max(1, page.offsetHeight - window.innerHeight)
      const progress = THREE.MathUtils.clamp(-bounds.top / travel, 0, 1)
      journeyProgressRef.current = progress
      page.style.setProperty('--basin-journey', progress.toFixed(3))
    }

    updateJourney()
    window.addEventListener('scroll', updateJourney, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    const clock = new THREE.Clock()
    const render = () => {
      if (!active) return
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime
      displayedProgress = reducedMotion
        ? journeyProgressRef.current
        : THREE.MathUtils.damp(displayedProgress, journeyProgressRef.current, 6, delta)
      const pathProgress = THREE.MathUtils.smootherstep(displayedProgress, 0, 1)
      if (!reducedMotion) {
        wheel.rotation.z = -elapsed * 0.42
        pond.material.opacity = 0.76 + Math.sin(elapsed * 0.9) * 0.06
        waterGlints.rotation.z = elapsed * 0.06
        birds.position.x = -3.6 + Math.sin(elapsed * 0.18) * 1.8
        birds.position.z = 11 + Math.cos(elapsed * 0.18) * 1.2
      }
      camera.position.copy(cameraPath.getPointAt(pathProgress))
      camera.lookAt(targetPath.getPointAt(pathProgress))
      renderer.render(scene, camera)
      requestAnimationFrame(render)
    }
    render()

    return () => {
      active = false
      window.removeEventListener('scroll', updateJourney)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      terrainGeometry.dispose()
    }
  }, [])

  useEffect(() => () => {
    stopAmbience()
  }, [])

  function stopAmbience() {
    const sound = soundRef.current
    if (!sound) return

    sound.sources.forEach((source) => source.stop())
    void sound.context.close()
    soundRef.current = null
    setSoundPlaying(false)
  }

  async function toggleAmbience() {
    if (soundRef.current) {
      stopAmbience()
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      setSoundError('This browser does not support Basin ambience.')
      return
    }

    const context = new AudioContext()
    const master = context.createGain()
    const water = context.createBufferSource()
    const waterFilter = context.createBiquadFilter()
    const waterMotion = context.createOscillator()
    const waterMotionRange = context.createGain()
    const wheel = context.createOscillator()
    const wheelGain = context.createGain()
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1
    }

    master.gain.value = 0.05
    water.buffer = noiseBuffer
    water.loop = true
    waterFilter.type = 'bandpass'
    waterFilter.frequency.value = 880
    waterFilter.Q.value = 0.55
    waterMotion.type = 'sine'
    waterMotion.frequency.value = 0.12
    waterMotionRange.gain.value = 240
    wheel.type = 'triangle'
    wheel.frequency.value = 46
    wheelGain.gain.value = 0.012

    waterMotion.connect(waterMotionRange)
    waterMotionRange.connect(waterFilter.frequency)
    water.connect(waterFilter)
    waterFilter.connect(master)
    wheel.connect(wheelGain)
    wheelGain.connect(master)
    master.connect(context.destination)

    try {
      await context.resume()
    } catch (error) {
      console.error('Basin ambience could not begin.', error)
      void context.close()
      setSoundError('Basin ambience could not begin in this browser.')
      return
    }

    water.start()
    waterMotion.start()
    wheel.start()
    soundRef.current = { context, sources: [water, waterMotion, wheel] }
    setSoundError('')
    setSoundPlaying(true)
  }

  return (
    <main className={`basin-page${relationship ? ` basin-page--${relationship}` : ''}`} ref={pageRef}>
      <canvas className="basin-canvas" ref={canvasRef} aria-label="Three-dimensional Basin approach to the Cabin" />
      <WorldThread active="basin" />
      <div className="basin-reading">
        <p>{basinRecord.title} / water system</p>
        <h1>The Cabin is uphill.</h1>
        <p>{basinSummary}</p>
        <p className="basin-reading__signals">Water catches between the trunks. Below, a wheel returns in brief motion.</p>
      </div>
      <aside className="basin-section" aria-label="Basin section">
        <svg viewBox="0 0 360 180" aria-hidden="true">
          <path className="basin-section__terrain" d="M8 155 C64 155 79 143 119 130 C157 118 188 101 215 77 C251 45 300 37 352 39" />
          <path className="basin-section__water" d="M16 154 C56 156 78 149 108 136 L159 121" />
          <path className="basin-section__stairs" d="M180 110 L185 105 L190 105 L195 100 L200 100 L205 95 L210 95 L215 90" />
          <circle className="basin-section__wheel" cx="148" cy="121" r="13" />
          <path className="basin-section__cabin" d="M270 55 L293 35 L316 55 V79 H270 Z M266 55 H320" />
        </svg>
        <div className="basin-section__labels">
          <span className="is-pond">pond</span>
          <span className="is-wheel">wheel</span>
          <span className="is-ascent">ascent</span>
          <span className="is-cabin">Cabin</span>
        </div>
      </aside>
      <aside className="basin-encounter" aria-label="Basin encounter">
        <p>Falls / lower works</p>
        <h2>The water has not always run this way.</h2>
        <span>The Warden keeps the waterworks in motion. Choose a relationship with the Basin, not an answer for the Cabin.</span>
        <div className="basin-encounter__choices">
          {relationships.map((choice) => (
            <button
              type="button"
              className={choice.id === relationship ? 'is-active' : ''}
              key={choice.id}
              onClick={() => setRelationship(choice.id)}
            >
              <strong>{choice.label}</strong>
              <span>{choice.action}</span>
            </button>
          ))}
        </div>
        {response && <p className="basin-encounter__response" aria-live="polite">{response.response}</p>}
        <button type="button" className="basin-sound" onClick={toggleAmbience} aria-pressed={soundPlaying}>
          {soundPlaying ? 'Quiet the waterworks' : 'Listen to the waterworks'}
        </button>
        {soundError && <p className="basin-sound-error" role="alert">{soundError}</p>}
      </aside>
      <div className="basin-controls">
        <span>Scroll to trace the Basin’s crossing paths</span>
        <Link to="/basin-falls">Enter the Basin of the Falls</Link>
        <Link to="/cabin-of-moss">Continue uphill to the porch</Link>
        <Link to="/">Return to Portal</Link>
      </div>
    </main>
  )
}

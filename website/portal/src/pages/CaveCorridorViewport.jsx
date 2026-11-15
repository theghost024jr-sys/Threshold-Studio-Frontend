import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { bendSeveranceGeometry, corridorSamples } from './CaveCorridorGeometry.js'

const EYE_HEIGHT = 1.65

function edgePoint(sample, side, elevation) {
  const offset = sample.width / 2 * side
  return [sample.position.x + sample.heading.z * offset, elevation, sample.position.z - sample.heading.x * offset]
}

function addCrystalVeins(scene) {
  const material = new THREE.MeshStandardMaterial({
    color: '#9ac6e8',
    emissive: '#4d8ac2',
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.4,
  })
  const group = new THREE.Group()
  for (const side of [-1, 1]) {
    for (let index = 0; index < 5; index += 1) {
      const points = Array.from({ length: 5 }, (_, pointIndex) => {
        const x = 6.5 + index * 1.65 + pointIndex * 0.34
        const z = 17 + side * (0.42 + ((index + pointIndex) % 2) * 0.1)
        const y = 0.4 + ((index * 0.31 + pointIndex * 0.43) % 1.7)
        return new THREE.Vector3(x, y, z)
      })
      const curve = new THREE.CatmullRomCurve3(points)
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.08, 5, false), material))
    }
  }
  scene.add(group)
  return { group, material }
}

function addCanyonParticles(scene) {
  const positions = []
  for (let index = 0; index < 180; index += 1) {
    const spread = index / 179
    positions.push(
      10 + spread * 6,
      0.15 + ((index * 13) % 17) / 17 * 2.8,
      14.5 + ((index * 29) % 41) / 41 * 5,
    )
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#e5a56c',
    size: 0.025,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  return { particles, material }
}

function sampleAtDistance(samples, distance) {
  return samples.find((sample) => sample.distance >= distance) ?? samples[samples.length - 1]
}

function addPassOneLights(scene, samples) {
  const lights = [
    { distance: 2.4, elevation: 2.25, color: '#b8c5dd', intensity: 4.8, range: 7 },
    { distance: 9.5, elevation: 1.9, color: '#8fa0bc', intensity: 3.8, range: 5.5 },
    { distance: 15.6, elevation: 1.65, color: '#7f91ae', intensity: 3.4, range: 4.2 },
    { distance: 17.4, elevation: 1.55, color: '#7187a8', intensity: 3.1, range: 3.8 },
  ]

  for (const lightSpec of lights) {
    const sample = sampleAtDistance(samples, lightSpec.distance)
    const light = new THREE.PointLight(lightSpec.color, lightSpec.intensity, lightSpec.range, 2)
    light.position.set(sample.position.x, lightSpec.elevation, sample.position.z)
    scene.add(light)
  }
}

function caveSurfaceColor(kind, sample, elevation) {
  const bendEnd = bendSeveranceGeometry.segments.bend.end
  const earlyProgress = Math.min(1, sample.distance / bendEnd)
  const variation = Math.sin(sample.distance * 1.65 + elevation * 2.8) * 0.15
  const colors = {
    floor: ['#514b58', '#34323d'],
    wall: ['#746a7a', '#4b4a58'],
    ceiling: ['#4b4654', '#2d2c37'],
  }
  const [mouth, bend] = colors[kind]
  return new THREE.Color(mouth).lerp(new THREE.Color(bend), earlyProgress).offsetHSL(0, 0, variation)
}

function frozenWallRelief(sample, elevation) {
  return (
    Math.sin(sample.distance * 1.9 + elevation * 2.7)
    + Math.sin(sample.distance * 4.1 - elevation * 1.6) * 0.45
  ) * 0.11
}

function isInsideBendWall(sample, side) {
  const bend = bendSeveranceGeometry.segments.bend
  const toBendCenterX = bend.radius - sample.position.x
  const toBendCenterZ = bend.start - sample.position.z
  const wallNormalX = sample.heading.z * side
  const wallNormalZ = -sample.heading.x * side
  return wallNormalX * toBendCenterX + wallNormalZ * toBendCenterZ > 0
}

function insideBendGuardFactor(distance) {
  const bend = bendSeveranceGeometry.segments.bend
  const rampLength = 1.5
  const approachStart = bend.start - rampLength
  const exitEnd = bend.end + rampLength

  if (distance < approachStart || distance > exitEnd) return 1
  if (distance <= bend.start) return (bend.start - distance) / rampLength
  if (distance <= bend.end) return 0
  return (distance - bend.end) / rampLength
}

function caveWallPoint(sample, point) {
  const side = Math.sign(
    (point[0] - sample.position.x) * sample.heading.z
    - (point[2] - sample.position.z) * sample.heading.x,
  )
  const guard = isInsideBendWall(sample, side) ? insideBendGuardFactor(sample.distance) : 1
  const relief = frozenWallRelief(sample, point[1]) * guard

  return [
    point[0] - sample.heading.z * side * relief,
    point[1] + relief * 0.45,
    point[2] + sample.heading.x * side * relief,
  ]
}

function addSurface(scene, samples, firstEdge, secondEdge, material, kind) {
  const vertices = []
  const colors = []
  const addVertex = (sample, point) => {
    vertices.push(...(kind === 'wall' ? caveWallPoint(sample, point) : point))
    const color = caveSurfaceColor(kind, sample, point[1])
    colors.push(color.r, color.g, color.b)
  }

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]
    const current = samples[index]
    addVertex(previous, firstEdge(previous))
    addVertex(current, firstEdge(current))
    addVertex(current, secondEdge(current))
    addVertex(previous, firstEdge(previous))
    addVertex(current, secondEdge(current))
    addVertex(previous, secondEdge(previous))
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const surface = new THREE.Mesh(geometry, material)
  scene.add(surface)
  return surface
}

function blendLookDirection(lookDirection, pathDirection, forwardBias) {
  const x = lookDirection.x * (1 - forwardBias) + pathDirection.x * forwardBias
  const y = lookDirection.y * (1 - forwardBias) + pathDirection.y * forwardBias
  const length = Math.hypot(x, y)

  return length === 0 ? lookDirection : { x: x / length, y: y / length }
}

function applyCorridorState(world, cameraState, environment) {
  const fov = cameraState?.fov ?? 68
  if (world.camera.fov !== fov) {
    world.camera.fov = fov
    world.camera.updateProjectionMatrix()
  }

  world.entranceLight.intensity = 9 * (0.25 + environment.originVisibility * 0.75)
  world.canyonLight.intensity = 14 * environment.canyonLight
  world.exit.material.opacity = Math.min(1, environment.exteriorVisibility)
  world.canyonGround.material.opacity = environment.exteriorVisibility * 0.85
  world.renderer.toneMappingExposure = 1 + cameraState.exposureBias
  world.crystal.material.opacity = 0.25 + environment.crystalPresence * 0.65
  world.crystal.material.emissiveIntensity = 0.8 + environment.crystalLegibility * 1.8
  world.crystalLight.intensity = environment.crystalLegibility * 2.5
  world.canyonParticles.material.opacity = environment.sandPresence * 0.8
}

function observeCanyonVisibility(world) {
  const { camera, exit, occluders } = world
  if (exit.material.opacity === 0) return false

  const frustum = new THREE.Frustum()
  frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
  if (!frustum.intersectsObject(exit)) return false

  const exitPosition = exit.getWorldPosition(new THREE.Vector3())
  const direction = exitPosition.clone().sub(camera.position)
  const exitDistance = direction.length()
  const intersections = new THREE.Raycaster(camera.position, direction.normalize()).intersectObjects(occluders, false)
  return !intersections.some((intersection) => intersection.distance < exitDistance - 0.01)
}

function renderPose(world, position, lookDirection, lookPitch, pathDirection, cameraState, environment, onCanyonVisibilityChange) {
  const { camera, renderer, scene } = world
  applyCorridorState(world, cameraState, environment)
  const direction = blendLookDirection(
    lookDirection,
    pathDirection,
    cameraState?.forwardBias ?? 0,
  )
  camera.position.set(position.x, EYE_HEIGHT, position.z)
  camera.lookAt(
    position.x + direction.x * 4,
    EYE_HEIGHT + Math.sin(lookPitch) * 4,
    position.z + direction.y * 4,
  )
  renderer.render(scene, camera)
  onCanyonVisibilityChange?.(observeCanyonVisibility(world))
}

export default function CaveCorridorViewport({
  cameraState,
  environment,
  position,
  lookDirection,
  lookPitch,
  pathDirection,
  onCanyonVisibilityChange,
}) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const poseRef = useRef({
    cameraState,
    environment,
    position,
    lookDirection,
    lookPitch,
    pathDirection,
    onCanyonVisibilityChange,
  })

  useEffect(() => {
    poseRef.current = {
      cameraState,
      environment,
      position,
      lookDirection,
      lookPitch,
      pathDirection,
      onCanyonVisibilityChange,
    }
  }, [cameraState, environment, lookDirection, lookPitch, onCanyonVisibilityChange, pathDirection, position])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#07070a')

    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 50)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene.add(new THREE.HemisphereLight('#a5b1d1', '#08070a', 1.8))
    const entranceLight = new THREE.PointLight('#c7e4a4', 9, 15, 2)
    entranceLight.position.set(0, 2, -4.8)
    scene.add(entranceLight)
    const canyonLight = new THREE.PointLight('#f3b27a', 0, 18, 2)
    canyonLight.position.set(20, 4, 17)
    scene.add(canyonLight)
    const crystalLight = new THREE.PointLight('#77b7eb', 0, 10, 2)
    crystalLight.position.set(9, 1.8, 17)
    scene.add(crystalLight)

    const wall = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.93, flatShading: true, side: THREE.DoubleSide })
    const floor = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.97, flatShading: true, side: THREE.DoubleSide })
    const ceiling = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.98, flatShading: true, side: THREE.DoubleSide })
    const samples = corridorSamples(0.1)
    const floorSurface = addSurface(scene, samples, (sample) => edgePoint(sample, -1, 0), (sample) => edgePoint(sample, 1, 0), floor, 'floor')
    const ceilingSurface = addSurface(scene, samples, (sample) => edgePoint(sample, 1, sample.height), (sample) => edgePoint(sample, -1, sample.height), ceiling, 'ceiling')
    const leftWall = addSurface(scene, samples, (sample) => edgePoint(sample, -1, 0), (sample) => edgePoint(sample, -1, sample.height), wall, 'wall')
    const rightWall = addSurface(scene, samples, (sample) => edgePoint(sample, 1, sample.height), (sample) => edgePoint(sample, 1, 0), wall, 'wall')
    addPassOneLights(scene, samples)
    const crystal = addCrystalVeins(scene)
    const canyonParticles = addCanyonParticles(scene)

    const { entrance } = bendSeveranceGeometry
    const opening = new THREE.Mesh(
      new THREE.PlaneGeometry(entrance.halfWidth * 2, entrance.height),
      new THREE.MeshBasicMaterial({ color: '#9fcb83', side: THREE.DoubleSide }),
    )
    opening.position.set(entrance.center.x, entrance.base + entrance.height / 2, entrance.center.z)
    scene.add(opening)

    const exit = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 12),
      new THREE.MeshBasicMaterial({
        color: '#f3b27a',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    )
    exit.position.set(24, 5, 17)
    exit.rotation.y = Math.PI / 2
    scene.add(exit)
    const canyonGround = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 20),
      new THREE.MeshBasicMaterial({
        color: '#b67a43',
        transparent: true,
        opacity: 0,
      }),
    )
    canyonGround.position.set(22, -0.01, 17)
    canyonGround.rotation.x = -Math.PI / 2
    scene.add(canyonGround)

    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#4d6244', roughness: 0.95, flatShading: true })
    for (const x of [-entrance.halfWidth, entrance.halfWidth]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, entrance.height + 0.35, 0.2), frameMaterial)
      frame.position.set(x, entrance.base + entrance.height / 2, entrance.center.z + 0.1)
      scene.add(frame)
    }

    const world = {
      scene,
      camera,
      renderer,
      entranceLight,
      canyonLight,
      crystalLight,
      exit,
      canyonGround,
      occluders: [floorSurface, ceilingSurface, leftWall, rightWall],
      crystal,
      canyonParticles,
    }
    worldRef.current = world
    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)
      const pose = poseRef.current
      renderPose(
        world,
        pose.position,
        pose.lookDirection,
        pose.lookPitch,
        pose.pathDirection,
        pose.cameraState,
        pose.environment,
        pose.onCanyonVisibilityChange,
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    return () => {
      observer.disconnect()
      scene.traverse((object) => {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        else object.material?.dispose()
      })
      renderer.dispose()
      worldRef.current = null
    }
  }, [])

  useEffect(() => {
    if (worldRef.current) {
      renderPose(
        worldRef.current,
        position,
        lookDirection,
        lookPitch,
        pathDirection,
        cameraState,
        environment,
        onCanyonVisibilityChange,
      )
    }
  }, [cameraState, environment, lookDirection, lookPitch, onCanyonVisibilityChange, pathDirection, position])

  return <canvas ref={canvasRef} className="cave-viewport" aria-hidden="true" />
}

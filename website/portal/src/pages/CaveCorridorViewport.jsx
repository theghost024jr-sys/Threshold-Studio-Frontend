import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { bendSeveranceGeometry, corridorSamples } from './CaveCorridorGeometry.js'

const EYE_HEIGHT = 1.65

function edgePoint(sample, side, elevation) {
  const offset = sample.width / 2 * side
  return [sample.position.x + sample.heading.z * offset, elevation, sample.position.z - sample.heading.x * offset]
}

function addSurface(scene, samples, firstEdge, secondEdge, material) {
  const vertices = []
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]
    const current = samples[index]
    vertices.push(...firstEdge(previous), ...firstEdge(current), ...secondEdge(current))
    vertices.push(...firstEdge(previous), ...secondEdge(current), ...secondEdge(previous))
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  scene.add(new THREE.Mesh(geometry, material))
}

function renderPose(world, position, lookDirection, lookPitch) {
  const { camera, renderer, scene } = world
  camera.position.set(position.x, EYE_HEIGHT, position.z)
  camera.lookAt(
    position.x + lookDirection.x * 4,
    EYE_HEIGHT + Math.sin(lookPitch) * 4,
    position.z + lookDirection.y * 4,
  )
  renderer.render(scene, camera)
}

export default function CaveCorridorViewport({ position, lookDirection, lookPitch }) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const poseRef = useRef({ position, lookDirection, lookPitch })

  useEffect(() => {
    poseRef.current = { position, lookDirection, lookPitch }
  }, [lookDirection, lookPitch, position])

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

    const wall = new THREE.MeshStandardMaterial({ color: '#37333a', roughness: 1, flatShading: true, side: THREE.DoubleSide })
    const floor = new THREE.MeshStandardMaterial({ color: '#18161b', roughness: 1, flatShading: true, side: THREE.DoubleSide })
    const ceiling = new THREE.MeshStandardMaterial({ color: '#100f13', roughness: 1, flatShading: true, side: THREE.DoubleSide })
    const samples = corridorSamples()
    addSurface(scene, samples, (sample) => edgePoint(sample, -1, 0), (sample) => edgePoint(sample, 1, 0), floor)
    addSurface(scene, samples, (sample) => edgePoint(sample, 1, sample.height), (sample) => edgePoint(sample, -1, sample.height), ceiling)
    addSurface(scene, samples, (sample) => edgePoint(sample, -1, 0), (sample) => edgePoint(sample, -1, sample.height), wall)
    addSurface(scene, samples, (sample) => edgePoint(sample, 1, sample.height), (sample) => edgePoint(sample, 1, 0), wall)

    const { entrance } = bendSeveranceGeometry
    const opening = new THREE.Mesh(
      new THREE.PlaneGeometry(entrance.halfWidth * 2, entrance.height),
      new THREE.MeshBasicMaterial({ color: '#9fcb83', side: THREE.DoubleSide }),
    )
    opening.position.set(entrance.center.x, entrance.base + entrance.height / 2, entrance.center.z)
    scene.add(opening)

    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#4d6244', roughness: 0.95, flatShading: true })
    for (const x of [-entrance.halfWidth, entrance.halfWidth]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, entrance.height + 0.35, 0.2), frameMaterial)
      frame.position.set(x, entrance.base + entrance.height / 2, entrance.center.z + 0.1)
      scene.add(frame)
    }

    const world = { scene, camera, renderer }
    worldRef.current = world
    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)
      const pose = poseRef.current
      renderPose(world, pose.position, pose.lookDirection, pose.lookPitch)
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
    if (worldRef.current) renderPose(worldRef.current, position, lookDirection, lookPitch)
  }, [lookDirection, lookPitch, position])

  return <canvas ref={canvasRef} className="cave-viewport" aria-hidden="true" />
}

import { useEffect, useRef } from 'react'
import image1 from '../../assets/img1.jpg'
import image2 from '../../assets/img2.jpg'
import image3 from '../../assets/img3.jpg'
import image4 from '../../assets/img4.jpg'
import image5 from '../../assets/img5.jpg'
import image6 from '../../assets/img6.jpg'
import image7 from '../../assets/img7.jpg'
import { advanceRotation, snapRotation } from './physics.js'
import './Carousel3D.css'

const images = [image1, image2, image3, image4, image5, image6, image7]

export default function Carousel3D() {
  const trackRef = useRef(null)
  const motionRef = useRef({ rotation: 0, velocity: 0, pointerX: 0, dragging: false, frame: 0, previousTime: 0 })

  useEffect(() => {
    const motion = motionRef.current
    const update = () => {
      if (trackRef.current) trackRef.current.style.setProperty('--rotation', `${motion.rotation}deg`)
    }
    const animate = (time) => {
      const elapsed = Math.min((time - motion.previousTime) / 1000, 0.05)
      motion.previousTime = time
      if (!motion.dragging) {
        if (Math.abs(motion.velocity) > 0.01) {
          const next = advanceRotation(motion.rotation, motion.velocity, elapsed)
          motion.rotation = next.rotation
          motion.velocity = next.velocity
        } else {
          motion.rotation += (snapRotation(motion.rotation, images.length) - motion.rotation) * Math.min(1, elapsed * 8)
        }
        update()
      }
      motion.frame = requestAnimationFrame(animate)
    }
    motion.frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(motion.frame)
  }, [])

  const pointerDown = (event) => {
    const motion = motionRef.current
    motion.dragging = true
    motion.velocity = 0
    motion.pointerX = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event) => {
    const motion = motionRef.current
    if (!motion.dragging) return
    const delta = event.clientX - motion.pointerX
    motion.pointerX = event.clientX
    motion.rotation += delta * 0.34
    motion.velocity = delta * 0.34
    trackRef.current?.style.setProperty('--rotation', `${motion.rotation}deg`)
  }
  const pointerUp = (event) => {
    motionRef.current.dragging = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <section className="carousel-3d" aria-label="Ella gallery">
      <div className="carousel-3d__viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <div ref={trackRef} className="carousel-3d__track">
          {images.map((image, index) => (
            <figure className="carousel-3d__item" style={{ '--angle': `${index * (360 / images.length)}deg` }} key={image}>
              <img src={image} alt={`Ella gallery image ${index + 1}`} draggable="false" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

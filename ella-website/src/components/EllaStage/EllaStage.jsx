import { useEffect, useRef } from 'react'
import backgroundImage from '../../assets/img1.jpg'
import subjectImage from '../../assets/ella-heard.png'
import { initializeSnowCanvas } from './SnowCanvas.js'
import { attachParallax } from './Parallax.js'
import { initializeMicroAnimations } from './MicroAnimations.js'
import './EllaStage.css'

export default function EllaStage() {
  const stageRef = useRef(null)
  const snowRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    const cleanups = [
      initializeSnowCanvas(snowRef.current),
      attachParallax(stage),
      initializeMicroAnimations(stage),
    ]
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])

  return (
    <section ref={stageRef} className="ella-stage" aria-label="Ella Heard stage">
      <img className="ella-stage__background" src={backgroundImage} alt="Ella Heard" />
      <div className="ella-stage__mist" aria-hidden="true" />
      <img className="ella-stage__subject" src={subjectImage} alt="" />
      <canvas ref={snowRef} className="ella-stage__snow" aria-hidden="true" />
      <div className="ella-stage__copy">
        <p>Ella Heard</p>
        <h1>Small moments in motion.</h1>
      </div>
    </section>
  )
}

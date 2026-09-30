import EllaStage from '../EllaStage/EllaStage.jsx'
import Carousel3D from '../Carousel3D/Carousel3D.jsx'
import TaskDocLeft from '../TaskDoc/TaskDocLeft.jsx'
import TaskDocRight from '../TaskDoc/TaskDocRight.jsx'
import './LayoutFrame.css'
import '../TaskDoc/TaskDoc.css'

export default function LayoutFrame() {
  return (
    <main className="layout-frame">
      <EllaStage />
      <Carousel3D />
      <section className="task-doc" aria-label="Ella's space">
        <TaskDocLeft />
        <TaskDocRight />
      </section>
    </main>
  )
}

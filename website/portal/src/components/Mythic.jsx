import { useMythic } from '../hooks/useMythic.js'

export default function Mythic() {
  const { mythic } = useMythic()

  return (
    <section className="mythic-panel" aria-labelledby="mythic-heading">
      <p className="eyebrow">Current companions</p>
      <h2 id="mythic-heading">{mythic.spirit}</h2>
      <p>{mythic.guardian}</p>
    </section>
  )
}
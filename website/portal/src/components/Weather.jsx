import { WEATHER_STATES } from '../modules/weather.js'
import { useMythic } from '../hooks/useMythic.js'

export default function Weather() {
  const { channel, setChannel } = useMythic()

  return (
    <section className="weather-panel" aria-label="Atmosphere">
      <p className="eyebrow">Atmosphere</p>
      <div className="weather-options" role="group" aria-label="Select atmosphere">
        {WEATHER_STATES.map((weather) => (
          <button
            className={weather.id === channel ? 'weather-option active' : 'weather-option'}
            key={weather.id}
            onClick={() => setChannel(weather.id)}
            type="button"
          >
            {weather.label}
          </button>
        ))}
      </div>
      <p className="weather-description">
        {(WEATHER_STATES.find((weather) => weather.id === channel) || WEATHER_STATES[0]).description}
      </p>
    </section>
  )
}
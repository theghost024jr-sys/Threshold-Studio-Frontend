import { useNavigate } from "react-router-dom";
import chambers from "./chambers.config.json";
import "./world.css";

export function WorldMap() {
  const navigate = useNavigate();

  return (
    <main className="world-map">
      <header className="world-map__header">
        <p className="world-map__eyebrow">Threshold navigation</p>
        <h1>Threshold World</h1>
        <p>Choose a place in the world to enter.</p>
      </header>

      <section className="world-map__grid" aria-label="World destinations">
        {chambers.map((chamber) => (
          <button
            key={chamber.id}
            className={`world-map__card world-map__card--${chamber.accent}`}
            type="button"
            onClick={() => navigate(chamber.path)}
          >
            <span>{chamber.type}</span>
            <h2>{chamber.name}</h2>
            <p>{chamber.description}</p>
          </button>
        ))}
      </section>
    </main>
  );
}

export default WorldMap;

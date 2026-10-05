import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChambers } from "./vault/vaultAdapter";

export function WorldMap() {
  const navigate = useNavigate();
  const [chambers, setChambers] = useState([]);

  useEffect(() => {
    let active = true;

    getChambers().then((nextChambers) => {
      if (active) {
        setChambers(nextChambers);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="world-map">
      <header className="world-map__header">
        <h1>Threshold World</h1>
        <p>Choose a place in the world to enter.</p>
      </header>

      <section className="world-map__grid" aria-label="World chambers">
        {chambers.map((chamber) => (
          <button
            key={chamber.id}
            className={`world-map__card world-map__card--${chamber.renderer}`}
            type="button"
            onClick={() => navigate(`/world/chambers/${chamber.id}`)}
          >
            <h2>{chamber.name}</h2>
            <p>{chamber.description}</p>
          </button>
        ))}
      </section>
    </main>
  );
}

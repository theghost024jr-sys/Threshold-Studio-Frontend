import React from "react";
import { useNavigate } from "react-router-dom";
import chambers from "./chambers.index.json";

export function WorldMap() {
    const navigate = useNavigate();

    return (
        <main className="world-map">
            <header className="world-map__header">
                <h1>Threshold World</h1>
                <p>Choose a place in the world to enter.</p>
            </header>

            <section className="world-map__grid">
                {chambers.map((chamber) => (
                    <button
                        key={chamber.id}
                        className={`world-map__card world-map__card--${chamber.renderer}`}
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

export default WorldMap;

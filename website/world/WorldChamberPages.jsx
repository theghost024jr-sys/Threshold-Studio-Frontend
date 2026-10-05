import { Link } from "react-router-dom";
import chambers from "./chambers/chambers.index.json";

function ChamberPage({ title, children }) {
  return (
    <main className="world-chamber">
      <p className="world-map__eyebrow">Threshold World</p>
      <h1>{title}</h1>
      <p>{children}</p>
      <Link to="/world">Return to world map</Link>
    </main>
  );
}

export function GardenPage() {
  return (
    <ChamberPage title="House & Garden">
      This is Threshold's resting space. Content to come.
    </ChamberPage>
  );
}

export function EllaPage() {
  return (
    <ChamberPage title="Ella">
      Cinematic signals and world-stage behavior will live here.
    </ChamberPage>
  );
}

export function ChambersIndexPage() {
  return (
    <main className="world-chamber">
      <p className="world-map__eyebrow">Threshold World</p>
      <h1>Chambers</h1>
      <p>Index of Threshold's rooms and dialogues.</p>
      <ul className="chamber-index">
        {chambers.map((chamber) => (
          <li key={chamber.id}>
            <Link to={`/world/chambers/${chamber.id}`}>{chamber.name}</Link>
          </li>
        ))}
      </ul>
      <Link to="/world">Return to world map</Link>
    </main>
  );
}

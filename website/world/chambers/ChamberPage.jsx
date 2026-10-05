import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadChamber } from "./loadChamber.js";
import { ChamberRenderer } from "./ChamberRenderer.jsx";

export function ChamberPage() {
  const { id } = useParams();
  const [chamber, setChamber] = useState(null);

  useEffect(() => {
    let active = true;

    loadChamber(id).then((nextChamber) => {
      if (active) {
        setChamber(nextChamber);
      }
    });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="chamber-page">
      {chamber ? <ChamberRenderer chamber={chamber} /> : <p>Opening chamber...</p>}
      <Link to="/world/chambers">Return to chambers</Link>
    </main>
  );
}

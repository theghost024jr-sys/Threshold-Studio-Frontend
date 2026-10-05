import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadChamber } from "./loadChamber";
import { ChamberRenderer } from "./ChamberRenderer";

export function ChamberPage() {
    const { id } = useParams();
    const [chamber, setChamber] = useState(null);

    useEffect(() => {
        loadChamber(id).then(setChamber);
    }, [id]);

    return (
        <main className="chamber-page">
            <ChamberRenderer chamber={chamber} />
        </main>
    );
}

import { DialogueRenderer } from "./renderers/DialogueRenderer.jsx";
import { EllaRenderer } from "./renderers/EllaRenderer.jsx";
import { ChamberFallbackRenderer } from "./renderers/ChamberFallbackRenderer.jsx";
import { GardenRenderer } from "./renderers/GardenRenderer.jsx";

export function ChamberRenderer({ chamber }) {
  if (!chamber || chamber.error) {
    return <ChamberFallbackRenderer error={chamber?.error} detail={chamber?.detail} />;
  }

  switch (chamber.renderer) {
    case "garden":
      return <GardenRenderer chamber={chamber} />;
    case "ella":
      return <EllaRenderer chamber={chamber} />;
    case "dialogue":
      return <DialogueRenderer chamber={chamber} />;
    default:
      return <ChamberFallbackRenderer error="unknown-renderer" />;
  }
}

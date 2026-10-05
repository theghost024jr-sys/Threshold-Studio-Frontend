import { GardenRenderer } from "./chambers/renderers/GardenRenderer";
import { EllaRenderer } from "./chambers/renderers/EllaRenderer";
import { DialogueRenderer } from "./chambers/renderers/DialogueRenderer";

export function ChamberRenderer({ chamber }) {
    if (!chamber || chamber.error) {
        return <div>Chamber not found.</div>;
    }

    const { renderer, content } = chamber;

    switch (renderer) {
        case "garden":
            return <GardenRenderer content={content} />;
        case "ella":
            return <EllaRenderer content={content} />;
        case "dialogue":
            return <DialogueRenderer content={content} />;
        default:
            return <div>Unknown chamber renderer.</div>;
    }
}

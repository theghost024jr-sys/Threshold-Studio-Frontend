import chambers from "./chambers.index.json";

export async function loadChamber(id) {
    const chamber = chambers.find((c) => c.id === id);
    if (!chamber) return { error: "not-found" };

    try {
        const file = await import(`./chambers/${chamber.file}?raw`);
        return {
            ...chamber,
            content: file.default
        };
    } catch (err) {
        return { error: "load-failed", details: err };
    }
}

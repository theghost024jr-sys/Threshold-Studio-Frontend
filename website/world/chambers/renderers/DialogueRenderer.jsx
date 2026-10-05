import { ChamberContent } from "./ChamberContent.jsx";

export function DialogueRenderer({ chamber }) {
  return (
    <section className="chamber chamber--dialogue">
      <h1>{chamber.name}</h1>
      <ChamberContent content={chamber.content} assets={chamber.assets} title={chamber.name} />
    </section>
  );
}

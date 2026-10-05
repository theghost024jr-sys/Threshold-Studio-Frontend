import { ChamberContent } from "./ChamberContent.jsx";

export function EllaRenderer({ chamber }) {
  return (
    <section className="chamber chamber--ella">
      <h1>{chamber.name}</h1>
      <ChamberContent content={chamber.content} />
    </section>
  );
}

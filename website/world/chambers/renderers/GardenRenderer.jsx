import { ChamberContent } from "./ChamberContent.jsx";

export function GardenRenderer({ chamber }) {
  return (
    <section className="chamber chamber--garden">
      <h1>{chamber.name}</h1>
      <ChamberContent content={chamber.content} />
    </section>
  );
}

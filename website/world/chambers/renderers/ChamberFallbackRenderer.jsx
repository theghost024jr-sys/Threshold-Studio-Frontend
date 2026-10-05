export function ChamberFallbackRenderer({ error, detail }) {
  const message = error === "load-failed"
    ? "This chamber could not be loaded."
    : "This chamber could not be found.";

  return (
    <section className="chamber chamber--fallback" role="alert">
      <h1>Chamber unavailable</h1>
      <p>{message}</p>
      {detail ? <p className="chamber__detail">{detail}</p> : null}
    </section>
  );
}

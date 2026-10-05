export function ChamberContent({ content }) {
  return (
    <article className="chamber__content">
      {content.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={`${index}-${paragraph}`}>{paragraph}</p>
      ))}
    </article>
  );
}

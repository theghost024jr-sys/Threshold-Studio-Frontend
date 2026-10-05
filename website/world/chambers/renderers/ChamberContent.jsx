import { renderMarkdownToSafeHtml } from "../../markdownRenderer.js";

function withoutDuplicateTitle(content, title) {
  const lines = content.split("\n");
  const firstLine = lines[0]?.match(/^#\s+(.+?)\s*$/);

  if (firstLine && firstLine[1].trim().toLowerCase() === title.trim().toLowerCase()) {
    return lines.slice(1).join("\n").replace(/^\s*\n/, "");
  }

  return content;
}

export function ChamberContent({ content, assets = [], title }) {
  const html = renderMarkdownToSafeHtml(withoutDuplicateTitle(content, title), assets);

  return (
    <article className="chamber__content" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

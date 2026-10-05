import DOMPurify from "dompurify";
import { marked } from "marked";

function assetUrlByName(assets) {
  return new Map(assets.map((asset) => [asset.name, asset.webPath]));
}

function rewriteVaultAssets(markdown, assets) {
  const assetUrls = assetUrlByName(assets);

  return markdown
    .replace(/!\[\[([^|\]#]+)(?:\|[^\]]+)?\]\]/g, (embed, name) => {
      const url = assetUrls.get(name.trim());
      return url ? `![${name.trim()}](${url})` : embed;
    })
    .replace(/!\[([^\]]*)\]\(vault:\/\/([^)]+)\)/g, (embed, alt, path) => {
      const normalizedPath = path.trim().replace(/^\/+/, "");
      const url = assetUrls.get(normalizedPath) || `/assets/vault/${normalizedPath}`;
      return `![${alt}](${url})`;
    })
    .replace(/\[\[([^|\]#]+)(?:\|([^\]]+))?\]\]/g, (reference, target, label) => (
      label ? label.trim() : target.trim()
    ));
}

export function renderMarkdownToSafeHtml(markdownBody, assets = []) {
  if (!markdownBody) {
    return "";
  }

  const rawHtml = marked.parse(rewriteVaultAssets(markdownBody, assets), {
    breaks: true,
    gfm: true
  });

  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true }
  });
}

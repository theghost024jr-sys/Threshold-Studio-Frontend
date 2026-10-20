import React from "react";
import ReactMarkdown from "react-markdown";
import { renderToStaticMarkup } from "react-dom/server";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");

function safeRelativePath(value, suffix, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..") ||
    path.posix.extname(value).toLowerCase() !== suffix
  ) {
    throw new Error(`${label} must be a safe relative ${suffix} path: ${value}`);
  }
  return value;
}

function resolveInside(root, relativePath, label) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, ...relativePath.split("/"));
  const relative = path.relative(resolvedRoot, resolvedPath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its approved directory: ${relativePath}`);
  }
  return resolvedPath;
}

function resolveConfiguredWebsitePath(websiteRoot, value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} must be a safe relative path`);
  }
  return resolveInside(websiteRoot, value, label);
}

function resolveConfiguredWebsiteRoot(configuration) {
  if (typeof configuration.websiteRoot !== "string") {
    throw new Error("threshold.config.json must define websiteRoot");
  }
  if (path.isAbsolute(configuration.websiteRoot)) {
    return path.resolve(configuration.websiteRoot);
  }
  if (
    path.win32.isAbsolute(configuration.websiteRoot) &&
    typeof configuration.systemRoot === "string" &&
    path.win32.isAbsolute(configuration.systemRoot)
  ) {
    const relative = path.win32.relative(configuration.systemRoot, configuration.websiteRoot);
    if (!relative || relative === ".." || relative.startsWith(`..${path.win32.sep}`)) {
      throw new Error("Configured websiteRoot must be inside systemRoot");
    }
    return resolveInside(repositoryRoot, relative.split(path.win32.sep).join("/"), "websiteRoot");
  }
  throw new Error("Configured websiteRoot must be an absolute platform path");
}

function renderMarkdown(body, assets) {
  const assetsByName = new Map(
    assets.map((asset) => [path.posix.basename(asset.name).toLowerCase(), asset]),
  );
  const markdown = body.replace(/!\[\[([^\]]+)\]\]/g, (_match, rawTarget) => {
    const target = rawTarget.split("|", 1)[0].trim();
    const asset = assetsByName.get(path.posix.basename(target).toLowerCase());
    if (!asset) {
      throw new Error(`Markdown image embed has no resolved public asset: ${target}`);
    }
    return `![${path.posix.basename(target)}](${asset.webPath})`;
  });
  return renderToStaticMarkup(React.createElement(ReactMarkdown, null, markdown));
}

function srcsetUrls(value) {
  const urls = [];
  let position = 0;
  while (position < value.length) {
    while (position < value.length && /[\s,]/.test(value[position])) {
      position += 1;
    }
    const start = position;
    while (position < value.length && !/\s/.test(value[position])) {
      position += 1;
    }
    let url = value.slice(start, position);
    const trailingCommas = url.match(/,+$/);
    if (trailingCommas) {
      url = url.slice(0, -trailingCommas[0].length);
    } else {
      while (position < value.length && value[position] !== ",") {
        position += 1;
      }
    }
    if (url) {
      urls.push(url);
    }
  }
  return urls;
}

async function validateLocalReferences(html, websiteRoot, pageRelativePath, generatedOutputPaths) {
  const references = [];
  for (const [, attribute, , value] of html.matchAll(
    /\b(src|href|srcset)\s*=\s*(["'])([\s\S]*?)\2/gi,
  )) {
    if (attribute.toLowerCase() === "srcset") {
      references.push(...srcsetUrls(value));
    } else {
      references.push(value);
    }
  }
  for (const match of html.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    references.push(match[1] ?? match[2] ?? match[3]);
  }

  for (const reference of references) {
    const trimmedReference = reference.trim();
    if (
      trimmedReference.startsWith("#") ||
      trimmedReference.startsWith("//") ||
      /^[a-z][a-z0-9+.-]*:/i.test(trimmedReference)
    ) {
      continue;
    }
    let pathname = trimmedReference.split(/[?#]/, 1)[0];
    if (!pathname) {
      continue;
    }
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      throw new Error(`Generated page has an invalid local reference: ${reference}`);
    }
    const relative = pathname.startsWith("/")
      ? pathname.slice(1)
      : path.posix.join(path.posix.dirname(pageRelativePath), pathname);
    const target = resolveInside(websiteRoot, relative, "HTML reference");
    if (generatedOutputPaths.has(target.toLowerCase())) {
      continue;
    }
    try {
      await access(target, constants.R_OK);
    } catch {
      throw new Error(`Generated page has a broken local reference: ${reference}`);
    }
  }
}

export async function generateVaultPages(options = {}) {
  const configuration =
    options.configuration ??
    JSON.parse(await readFile(path.resolve(repositoryRoot, "threshold.config.json"), "utf8"));
  const websiteRoot = path.resolve(options.websiteRoot ?? resolveConfiguredWebsiteRoot(configuration));
  const pageConfiguration = configuration.pages;
  if (!pageConfiguration || typeof pageConfiguration !== "object") {
    throw new Error("threshold.config.json must define a pages object");
  }
  const jobsPath =
    options.jobsPath ??
    resolveConfiguredWebsitePath(websiteRoot, pageConfiguration.renderJobs, "Page render jobs path");
  const templateRoot =
    options.templateRoot ??
    resolveConfiguredWebsitePath(websiteRoot, pageConfiguration.templates, "Page template directory");
  const outputRoot =
    options.outputRoot ??
    resolveConfiguredWebsitePath(websiteRoot, pageConfiguration.output, "Generated pages directory");
  const resolvedOutputRoot = path.resolve(outputRoot);
  const websiteRelativeOutput = path.relative(websiteRoot, resolvedOutputRoot);
  if (
    !websiteRelativeOutput ||
    websiteRelativeOutput === ".." ||
    websiteRelativeOutput.startsWith(`..${path.sep}`) ||
    path.isAbsolute(websiteRelativeOutput) ||
    path.extname(websiteRelativeOutput)
  ) {
    throw new Error("Generated pages directory must be a dedicated directory inside websiteRoot");
  }
  const protectedRoots = [
    templateRoot,
    path.resolve(websiteRoot, "assets"),
    path.resolve(websiteRoot, "config"),
    path.resolve(websiteRoot, "data"),
    path.resolve(websiteRoot, "portal"),
    path.resolve(websiteRoot, "portal-dist"),
  ];
  for (const protectedRoot of protectedRoots) {
    const outputToProtected = path.relative(resolvedOutputRoot, protectedRoot);
    const protectedToOutput = path.relative(protectedRoot, resolvedOutputRoot);
    if (
      outputToProtected === "" ||
      (!outputToProtected.startsWith(`..${path.sep}`) && outputToProtected !== "..") ||
      protectedToOutput === "" ||
      (!protectedToOutput.startsWith(`..${path.sep}`) && protectedToOutput !== "..")
    ) {
      throw new Error("Generated pages directory overlaps a protected website directory");
    }
  }
  const jobsData = JSON.parse(await readFile(jobsPath, "utf8"));
  if (jobsData.version !== 1 || !Array.isArray(jobsData.jobs)) {
    throw new Error("Vault render jobs must have version 1 and a jobs array");
  }

  const outputs = new Set();
  const renderedPages = [];
  for (const job of jobsData.jobs) {
    if (
      !job ||
      job.status !== "valid" ||
      typeof job.noteId !== "string" ||
      typeof job.relativePath !== "string" ||
      typeof job.markdownBody !== "string" ||
      !Array.isArray(job.resolvedAssets)
    ) {
      throw new Error("Each render job must satisfy the PageRenderJob contract with status valid");
    }
    const templateRelative = safeRelativePath(job.templateId, ".html", "Template");
    const outputRelative = safeRelativePath(job.outputPath, ".html", "Output");
    if (path.posix.basename(templateRelative, ".html") !== path.posix.basename(job.relativePath, ".md")) {
      throw new Error(`Template filename must exactly match note filename: ${job.relativePath}`);
    }
    if (path.posix.basename(outputRelative, ".html") !== path.posix.basename(job.relativePath, ".md")) {
      throw new Error(`Output filename must exactly match note filename: ${job.relativePath}`);
    }
    const outputPath = resolveInside(outputRoot, outputRelative, "Generated page output");
    const outputKey = outputPath.toLowerCase();
    if (outputs.has(outputKey)) {
      throw new Error(`Duplicate generated page output: ${outputRelative}`);
    }
    outputs.add(outputKey);

    const templatePath = resolveInside(templateRoot, templateRelative, "HTML template");
    const template = await readFile(templatePath, "utf8");
    const beginMarker = "<!-- BEGIN_CONTENT -->";
    const endMarker = "<!-- END_CONTENT -->";
    const beginIndex = template.indexOf(beginMarker);
    const endIndex = template.indexOf(endMarker);
    if (
      beginIndex < 0 ||
      endIndex < 0 ||
      beginIndex >= endIndex ||
      template.indexOf(beginMarker, beginIndex + beginMarker.length) >= 0 ||
      template.indexOf(endMarker, endIndex + endMarker.length) >= 0
    ) {
      throw new Error(`Template must contain one ordered content marker pair: ${templateRelative}`);
    }

    const assets = job.resolvedAssets;
    for (const asset of assets) {
      if (typeof asset.webPath !== "string" || !asset.webPath.startsWith("/assets/vault/")) {
        throw new Error(`Invalid public asset URL in render job ${job.relativePath}`);
      }
      const assetPath = resolveInside(websiteRoot, asset.webPath.slice(1), "Public asset");
      await access(assetPath, constants.R_OK);
    }
    const fragment = renderMarkdown(job.markdownBody, assets);
    const html =
      template.slice(0, beginIndex + beginMarker.length) +
      `\n${fragment}\n` +
      template.slice(endIndex);
    if (!html.startsWith("<!DOCTYPE html>") || !html.includes("</html>")) {
      throw new Error(`Generated page is not a complete HTML document: ${job.relativePath}`);
    }
    const pageRelativePath = path.relative(websiteRoot, outputPath).split(path.sep).join("/");
    renderedPages.push({ outputPath, pageRelativePath, html });
  }

  for (const page of renderedPages) {
    await validateLocalReferences(page.html, websiteRoot, page.pageRelativePath, outputs);
  }

  await rm(outputRoot, { recursive: true, force: true });
  for (const page of renderedPages) {
    await mkdir(path.dirname(page.outputPath), { recursive: true });
    await writeFile(page.outputPath, `${page.html.trimEnd()}\n`, "utf8");
  }
  return renderedPages.map(({ outputPath }) => outputPath);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pages = await generateVaultPages();
  console.log(`Generated ${pages.length} mapped vault page(s).`);
}

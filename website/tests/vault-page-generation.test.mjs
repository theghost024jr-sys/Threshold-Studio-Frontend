import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { generateVaultPages } from "../portal/scripts/generate-vault-pages.mjs";

async function createFixture(t, jobOverrides = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "threshold-vault-pages-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const websiteRoot = path.join(root, "website");
  const templateRoot = path.join(websiteRoot, "page-templates");
  const outputRoot = path.join(websiteRoot, "generated-pages");
  const jobsPath = path.join(websiteRoot, "data", "vault-render-jobs.json");
  await mkdir(path.join(templateRoot, "environment"), { recursive: true });
  await mkdir(path.join(websiteRoot, "assets", "vault"), { recursive: true });
  await writeFile(path.join(websiteRoot, "assets", "vault", "basin.png"), "image");
  await writeFile(path.join(websiteRoot, "environment-link.html"), "<!DOCTYPE html>");
  await writeFile(
    path.join(templateRoot, "environment", "basin.html"),
    `<!DOCTYPE html>
<html lang="en"><head><title>Basin</title></head><body><main>
<!-- BEGIN_CONTENT -->
<h1>Old content</h1>
<!-- END_CONTENT -->
<a href="/environment-link.html">Return</a>
<a href="../../environment-link.html">Relative return</a></main></body></html>`,
  );
  await mkdir(path.dirname(jobsPath), { recursive: true });
  await writeFile(
    jobsPath,
    JSON.stringify({
      version: 1,
      jobs: [
        {
          noteId: "basin",
          relativePath: "_publish/basin.md",
          templateId: "environment/basin.html",
          outputPath: "environment/basin.html",
          markdownBody: "# Basin\n\n![[basin.png]]\n\nA quiet pool.",
          resolvedAssets: [{ name: "basin.png", webPath: "/assets/vault/basin.png" }],
          status: "valid",
          ...jobOverrides,
        },
      ],
    }),
  );
  return {
    websiteRoot,
    jobsPath,
    templateRoot,
    outputRoot,
    configuration: {
      websiteRoot,
      pages: {
        mapping: "page-mapping.json",
        templates: "page-templates",
        output: "generated-pages",
        renderJobs: "data/vault-render-jobs.json",
      },
    },
  };
}

test("renders a note into its exact-name template and resolves embedded assets", async (t) => {
  const fixture = await createFixture(t);

  const pages = await generateVaultPages(fixture);

  assert.deepEqual(pages, [path.join(fixture.outputRoot, "environment", "basin.html")]);
  const html = await readFile(pages[0], "utf8");
  assert.match(html, /<h1>Basin<\/h1>/);
  assert.match(html, /<img src="\/assets\/vault\/basin\.png" alt="basin\.png"\s*\/>/);
  assert.match(html, /A quiet pool\./);
  assert.doesNotMatch(html, /Old content/);
  assert.match(html, /href="\/environment-link\.html"/);
  assert.match(html, /href="\.\.\/\.\.\/environment-link\.html"/);
});

test("validates links to other pages generated in the same build", async (t) => {
  const fixture = await createFixture(t);
  const jobsData = JSON.parse(await readFile(fixture.jobsPath, "utf8"));
  jobsData.jobs.push({
    noteId: "waterfall",
    relativePath: "_publish/waterfall.md",
    templateId: "environment/waterfall.html",
    outputPath: "environment/waterfall.html",
    markdownBody: "# Waterfall",
    resolvedAssets: [],
    status: "valid",
  });
  await writeFile(fixture.jobsPath, JSON.stringify(jobsData));

  const basinTemplatePath = path.join(fixture.templateRoot, "environment", "basin.html");
  const basinTemplate = await readFile(basinTemplatePath, "utf8");
  await writeFile(
    basinTemplatePath,
    basinTemplate.replace("</main>", '<a href="waterfall.html">Waterfall</a></main>'),
  );
  await writeFile(
    path.join(fixture.templateRoot, "environment", "waterfall.html"),
    `<!DOCTYPE html><html><body>
<!-- BEGIN_CONTENT -->
<!-- END_CONTENT -->
<a href="basin.html">Basin</a></body></html>`,
  );

  const pages = await generateVaultPages(fixture);

  assert.equal(pages.length, 2);
});

test("rejects templates without exactly one ordered content region", async (t) => {
  const fixture = await createFixture(t);
  const templatePath = path.join(fixture.templateRoot, "environment", "basin.html");
  await writeFile(templatePath, "<!DOCTYPE html><html><body>No region</body></html>");

  await assert.rejects(
    generateVaultPages(fixture),
    /one ordered content marker pair/,
  );
});

test("rejects unresolved embedded media instead of emitting a broken image", async (t) => {
  const fixture = await createFixture(t, {
    markdownBody: "# Basin\n\n![[missing.png]]",
  });

  await assert.rejects(generateVaultPages(fixture), /no resolved public asset/);
});

test("checks every local srcset source, including picture sources", async (t) => {
  const fixture = await createFixture(t);
  const templatePath = path.join(fixture.templateRoot, "environment", "basin.html");
  const template = await readFile(templatePath, "utf8");
  await writeFile(
    templatePath,
    template.replace(
      "</main>",
      '<picture><source srcset="/assets/vault/basin.png 1x, /missing.png 2x"></picture></main>',
    ),
  );

  await assert.rejects(generateVaultPages(fixture), /broken local reference: \/missing\.png/);
});

test("checks local CSS url references", async (t) => {
  const fixture = await createFixture(t);
  const templatePath = path.join(fixture.templateRoot, "environment", "basin.html");
  const template = await readFile(templatePath, "utf8");
  await writeFile(
    templatePath,
    template.replace("</main>", '<div style="background-image: url(\'/missing.png\')"></div></main>'),
  );

  await assert.rejects(generateVaultPages(fixture), /broken local reference: \/missing\.png/);
});

test("rejects unsafe generated output paths", async (t) => {
  const fixture = await createFixture(t, { outputPath: "../basin.html" });

  await assert.rejects(generateVaultPages(fixture), /safe relative \.html path/);
});

test("refuses to clean an output directory that overlaps website assets", async (t) => {
  const fixture = await createFixture(t);

  await assert.rejects(
    generateVaultPages({ ...fixture, outputRoot: path.join(fixture.websiteRoot, "assets") }),
    /overlaps a protected website directory/,
  );
});

test("declares the Pages Hub capability and ordered build-time graph", async () => {
  const repositoryRoot = new URL("../../", import.meta.url);
  const [configuration, hubRegistry, buildGraph] = await Promise.all([
    readFile(new URL("threshold.config.json", repositoryRoot), "utf8").then(JSON.parse),
    readFile(new URL("website/config/hub-capabilities.json", repositoryRoot), "utf8").then(JSON.parse),
    readFile(new URL("engine/build-graph.json", repositoryRoot), "utf8").then(JSON.parse),
  ]);
  const pagesCapability = hubRegistry.capabilities.find(({ id }) => id === "hub.pages");
  const basinSandbox = hubRegistry.capabilities.find(({ id }) => id === "environment.basin-sandbox");

  assert.deepEqual(configuration.pages, {
    mapping: "page-mapping.json",
    templates: "page-templates",
    output: "generated-pages",
    renderJobs: "data/vault-render-jobs.json",
  });
  assert.deepEqual(pagesCapability.dependsOn, ["vault.exporter", "website.page-mapping"]);
  assert.equal(pagesCapability.owner, "website-build-pipeline");
  assert.deepEqual(basinSandbox.dependsOn, [
    "website.environment.herb-room",
    "website.environment.basin.audio",
  ]);
  assert.deepEqual(basinSandbox.outputs, ["website/environment/basin.html"]);
  assert.match(basinSandbox.description, /without retrofitting/i);

  const stepIds = buildGraph.steps.map(({ id }) => id);
  assert.ok(stepIds.indexOf("export_vault_data") < stepIds.indexOf("generate_page_jobs"));
  assert.ok(stepIds.indexOf("generate_page_jobs") < stepIds.indexOf("generate_pages"));
  assert.ok(stepIds.indexOf("generate_pages") < stepIds.indexOf("vite_build"));
  assert.ok(stepIds.indexOf("vite_build") < stepIds.indexOf("assemble_pages_output"));
  assert.ok(stepIds.indexOf("assemble_pages_output") < stepIds.indexOf("deploy"));
});

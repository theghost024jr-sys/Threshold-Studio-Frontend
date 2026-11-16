import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

export const FALLBACK_ROUTE_CONTENTS = 'Portal route fallback.'
export const PUBLICATION_PLACEHOLDERS = [
  'cave-corridor',
  'cave-corridor-prototype',
]

const PLACEHOLDER_MANIFEST_NAME = 'publication-placeholders.json'
const OUTPUT_MANIFEST_NAME = 'publication-output-manifest.json'

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

function isWithinDirectory(path, directory) {
  const pathFromDirectory = relative(directory, path)
  return pathFromDirectory !== '' && !pathFromDirectory.startsWith(`..${sep}`) && pathFromDirectory !== '..'
}

function validatePlaceholderPath(path) {
  if (
    typeof path !== 'string'
    || path.length === 0
    || path.includes('/')
    || path.includes('\\')
    || path === '.'
    || path === '..'
  ) {
    throw new Error(`Invalid publication placeholder path: ${path}`)
  }
}

function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`
}

export async function assemblePublicationOutput({
  portalDirectory,
  outputDirectory,
  placeholderPaths = PUBLICATION_PLACEHOLDERS,
  publicationDirectory = resolve(outputDirectory, 'publication-routes'),
  manifestDirectory = outputDirectory,
  sourcePathPrefix = 'website/portal',
  outputPathPrefix = 'website/portal-dist/publication-routes',
  portalShellOutputPath = 'website/portal-dist/portal-shell.txt',
}) {
  const uniquePaths = new Set(placeholderPaths)
  if (uniquePaths.size !== placeholderPaths.length) {
    throw new Error('Publication placeholder paths must be unique.')
  }

  const shellPath = resolve(outputDirectory, 'portal-shell.txt')
  const shell = await readFile(shellPath)
  const sources = []

  for (const placeholderPath of [...placeholderPaths].sort()) {
    validatePlaceholderPath(placeholderPath)
    const sourcePath = resolve(portalDirectory, placeholderPath)
    if (!isWithinDirectory(sourcePath, portalDirectory)) {
      throw new Error(`Publication placeholder escapes the Portal directory: ${placeholderPath}`)
    }

    const source = await readFile(sourcePath, 'utf8')
    if (source.trim() !== FALLBACK_ROUTE_CONTENTS) {
      throw new Error(`Publication placeholder is not the fallback sentinel: ${placeholderPath}`)
    }

    sources.push({ placeholderPath, sourcePath, source })
  }

  await rm(publicationDirectory, { recursive: true, force: true })
  await mkdir(publicationDirectory, { recursive: true })

  const entries = []
  for (const { placeholderPath, sourcePath, source } of sources) {
    const outputPath = resolve(publicationDirectory, placeholderPath)
    if (!isWithinDirectory(outputPath, publicationDirectory)) {
      throw new Error(`Publication output escapes the staging directory: ${placeholderPath}`)
    }

    await writeFile(outputPath, shell)
    entries.push({
      sourcePath: `${sourcePathPrefix}/${placeholderPath}`,
      sourceSha256: sha256(source),
      outputPath: `${outputPathPrefix}/${placeholderPath}`,
      outputSha256: sha256(shell),
    })
  }

  const placeholderManifest = {
    schema: 'threshold-publication-placeholders/v1',
    entries,
  }
  const placeholderManifestContents = serializeManifest(placeholderManifest)
  await writeFile(resolve(manifestDirectory, PLACEHOLDER_MANIFEST_NAME), placeholderManifestContents)

  const outputManifest = {
    schema: 'threshold-publication-output/v1',
    portalShell: {
      outputPath: portalShellOutputPath,
      outputSha256: sha256(shell),
    },
    routes: entries.map(({ outputPath, outputSha256 }) => ({ outputPath, outputSha256 })),
  }
  const outputManifestContents = serializeManifest(outputManifest)
  await writeFile(resolve(manifestDirectory, OUTPUT_MANIFEST_NAME), outputManifestContents)

  return {
    mode: 'isolated-publication-output',
    placeholderManifestSha256: sha256(placeholderManifestContents),
    placeholderCount: entries.length,
    outputManifestSha256: sha256(outputManifestContents),
  }
}

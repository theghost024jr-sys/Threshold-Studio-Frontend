import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { writeBuildMarker } from './build-marker.mjs'

const outputDirectory = resolve(import.meta.dirname, '../../portal-dist')
const portalDirectory = resolve(import.meta.dirname, '..')
const fallbackRouteContents = 'Portal route fallback.'

await copyFile(
  resolve(outputDirectory, 'index.html'),
  resolve(outputDirectory, 'portal-shell.txt'),
)

const shell = await readFile(resolve(outputDirectory, 'portal-shell.txt'), 'utf8')
const marker = await writeBuildMarker(outputDirectory)

async function restorePortalRouteShells(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      if (!['node_modules', 'public', 'scripts', 'src'].includes(entry.name)) {
        await restorePortalRouteShells(path)
      }
      return
    }

    const contents = await readFile(path, 'utf8')
    if (contents.trim() === fallbackRouteContents) {
      await writeFile(path, shell, 'utf8')
    }
  }))
}

await restorePortalRouteShells(portalDirectory)
console.log(`Portal build marker written for ${marker.commit}`)
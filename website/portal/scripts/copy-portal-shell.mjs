import { copyFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readCleanSourceIdentity, writeBuildMarker } from './build-marker.mjs'
import { assemblePublicationOutput } from './publication-assembly.mjs'

const outputDirectory = resolve(import.meta.dirname, '../../portal-dist')
const portalDirectory = resolve(import.meta.dirname, '..')
const markerPath = resolve(outputDirectory, 'build-marker.json')

await rm(markerPath, { force: true })
const sourceIdentity = await readCleanSourceIdentity()

await copyFile(resolve(outputDirectory, 'index.html'), resolve(outputDirectory, 'portal-shell.txt'))
const assembly = await assemblePublicationOutput({ portalDirectory, outputDirectory })
const marker = await writeBuildMarker(outputDirectory, { sourceIdentity, assembly })
console.log(`Portal build marker written for ${marker.commit}`)
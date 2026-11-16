import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  runCandidateVite,
  validateAssemblyProvenance,
  validateRunnerProvenance,
} from '../portal/scripts/external-pages-staging-runner.mjs'

const sha256 = (contents) => createHash('sha256').update(contents).digest('hex')

test('ER-13 rejects global, raw, legacy, and out-of-stage Vite invocation', async () => {
  const candidateRoot = resolve('C:\\fixture', 'candidate')
  const stagingRoot = resolve('C:\\fixture', 'stage')
  const viteExecutable = resolve(candidateRoot, 'website', 'portal', 'node_modules', '.bin', 'vite.js')
  const configPath = resolve(candidateRoot, 'website', 'portal', 'vite.config.js')
  const outDir = resolve(stagingRoot, 'portal-dist')

  for (const overrides of [
    { viteExecutable: resolve('C:\\fixture', 'global-vite.js') },
    { configPath: resolve('C:\\fixture', 'global-vite.config.js') },
    { outDir: resolve('C:\\fixture', 'redirected-output') },
    { command: 'vite build' },
    { script: 'build:site' },
    { args: ['--legacy'] },
  ]) {
    await assert.rejects(
      runCandidateVite({ candidateRoot, stagingRoot, viteExecutable, configPath, outDir, ...overrides }),
      /must be explicit/,
    )
  }
})

test('ER-16 rejects invalid manifests, module hashes, paths, and timestamps', () => {
  const placeholderManifest = {
    schema: 'threshold-publication-placeholders/v1',
    entries: [{
      sourcePath: 'website/portal/cave-corridor',
      sourceSha256: 'a'.repeat(64),
      outputPath: 'portal/cave-corridor',
      outputSha256: 'b'.repeat(64),
    }],
  }
  const outputManifest = {
    schema: 'threshold-publication-output/v1',
    portalShell: { outputPath: 'portal-dist/portal-shell.txt', outputSha256: 'c'.repeat(64) },
    routes: [{ outputPath: 'portal/cave-corridor', outputSha256: 'b'.repeat(64) }],
  }
  const placeholderManifestContents = `${JSON.stringify(placeholderManifest)}\n`
  const outputManifestContents = `${JSON.stringify(outputManifest)}\n`
  const assembly = {
    placeholderManifestSha256: sha256(placeholderManifestContents),
    outputManifestSha256: sha256(outputManifestContents),
  }
  const provenance = {
    schema: 'threshold-attestation-runner/v1',
    runner: { modules: [{ path: 'website/portal/scripts/external-pages-staging-runner.mjs', sha256: 'd'.repeat(64) }] },
  }

  assert.throws(
    () => validateAssemblyProvenance({ assembly: { ...assembly, outputManifestSha256: '0'.repeat(64) }, placeholderManifestContents, outputManifestContents }),
    /hash does not match/,
  )
  placeholderManifest.entries[0].outputPath = '../outside'
  const invalidPathContents = `${JSON.stringify(placeholderManifest)}\n`
  assert.throws(
    () => validateAssemblyProvenance({
      assembly: { ...assembly, placeholderManifestSha256: sha256(invalidPathContents) },
      placeholderManifestContents: invalidPathContents,
      outputManifestContents,
    }),
    /manifest path/,
  )
  assert.throws(
    () => validateRunnerProvenance({ ...provenance, runner: { modules: [{ path: '../escape', sha256: 'not-a-hash' }] } }),
    /manifest path/,
  )
  assert.throws(
    () => validateRunnerProvenance({ ...provenance, builtAtUtc: '2026-11-15T08:00:00.000Z' }),
    /Invalid runner provenance/,
  )
})

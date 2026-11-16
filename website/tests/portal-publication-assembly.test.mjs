import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

import {
  readCleanSourceIdentity,
  writeBuildMarker,
} from '../portal/scripts/build-marker.mjs'
import {
  assemblePublicationOutput,
  FALLBACK_ROUTE_CONTENTS,
} from '../portal/scripts/publication-assembly.mjs'

const execFileAsync = promisify(execFile)

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

async function createFixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'threshold-publication-assembly-'))
  const portalDirectory = resolve(root, 'portal')
  const outputDirectory = resolve(root, 'portal-dist')
  await mkdir(portalDirectory)
  await mkdir(outputDirectory)
  await writeFile(resolve(portalDirectory, 'cave-corridor'), `${FALLBACK_ROUTE_CONTENTS}\n`, { encoding: 'utf8', flag: 'w' })
  await writeFile(resolve(portalDirectory, 'cave-corridor-prototype'), `${FALLBACK_ROUTE_CONTENTS}\n`, { encoding: 'utf8', flag: 'w' })
  await writeFile(resolve(outputDirectory, 'portal-shell.txt'), '<!doctype html><title>Threshold Portal</title>\n', { encoding: 'utf8', flag: 'w' })
  return { root, portalDirectory, outputDirectory }
}

test('materializes declared placeholders only in isolated publication output', async () => {
  const fixture = await createFixture()

  try {
    const assembly = await assemblePublicationOutput({
      portalDirectory: fixture.portalDirectory,
      outputDirectory: fixture.outputDirectory,
    })

    assert.deepEqual(assembly, {
      mode: 'isolated-publication-output',
      placeholderManifestSha256: assembly.placeholderManifestSha256,
      placeholderCount: 2,
      outputManifestSha256: assembly.outputManifestSha256,
    })
    assert.match(assembly.placeholderManifestSha256, /^[0-9a-f]{64}$/)
    assert.match(assembly.outputManifestSha256, /^[0-9a-f]{64}$/)

    assert.equal(
      await readFile(resolve(fixture.portalDirectory, 'cave-corridor'), 'utf8'),
      `${FALLBACK_ROUTE_CONTENTS}\n`,
    )
    assert.equal(
      await readFile(resolve(fixture.portalDirectory, 'cave-corridor-prototype'), 'utf8'),
      `${FALLBACK_ROUTE_CONTENTS}\n`,
    )

    const shell = '<!doctype html><title>Threshold Portal</title>\n'
    assert.equal(
      await readFile(resolve(fixture.outputDirectory, 'publication-routes', 'cave-corridor'), 'utf8'),
      shell,
    )
    assert.equal(
      await readFile(resolve(fixture.outputDirectory, 'publication-routes', 'cave-corridor-prototype'), 'utf8'),
      shell,
    )

    const placeholders = await readFile(resolve(fixture.outputDirectory, 'publication-placeholders.json'), 'utf8')
    const output = await readFile(resolve(fixture.outputDirectory, 'publication-output-manifest.json'), 'utf8')
    assert.equal(sha256(placeholders), assembly.placeholderManifestSha256)
    assert.equal(sha256(output), assembly.outputManifestSha256)
    assert.equal(JSON.parse(placeholders).entries.length, 2)
    assert.equal(JSON.parse(output).portalShell.outputSha256, sha256(shell))
    assert.equal(JSON.stringify(JSON.parse(output)).includes('build-marker.json'), false)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('preserves clean Git source identity and reproducible manifests across isolated assemblies', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'threshold-publication-integration-'))
  const portalDirectory = resolve(root, 'website', 'portal')
  const outputDirectory = resolve(root, 'website', 'portal-dist')
  const runGit = async (...args) => execFileAsync('git', ['-C', root, ...args])

  try {
    await mkdir(portalDirectory, { recursive: true })
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(resolve(root, '.gitignore'), 'website/portal-dist/\n', 'utf8')
    await writeFile(resolve(portalDirectory, 'cave-corridor'), `${FALLBACK_ROUTE_CONTENTS}\n`, 'utf8')
    await writeFile(resolve(portalDirectory, 'cave-corridor-prototype'), `${FALLBACK_ROUTE_CONTENTS}\n`, 'utf8')
    await writeFile(resolve(outputDirectory, 'portal-shell.txt'), '<!doctype html><title>Threshold Portal</title>\n', 'utf8')

    await runGit('init', '--quiet')
    await runGit('config', 'user.name', 'Threshold test')
    await runGit('config', 'user.email', 'threshold-test@example.invalid')
    await runGit('add', '.gitignore', 'website/portal/cave-corridor', 'website/portal/cave-corridor-prototype')
    await runGit('commit', '--quiet', '-m', 'Add publication placeholders')

    const sourceIdentity = await readCleanSourceIdentity({ repositoryRoot: root })
    const firstAssembly = await assemblePublicationOutput({ portalDirectory, outputDirectory })
    const firstPlaceholderManifest = await readFile(resolve(outputDirectory, 'publication-placeholders.json'), 'utf8')
    const firstOutputManifest = await readFile(resolve(outputDirectory, 'publication-output-manifest.json'), 'utf8')
    const marker = await writeBuildMarker(outputDirectory, {
      sourceIdentity,
      assembly: firstAssembly,
      repositoryRoot: root,
      now: new Date('2026-11-15T08:00:00.000Z'),
    })

    const secondAssembly = await assemblePublicationOutput({ portalDirectory, outputDirectory })
    const secondPlaceholderManifest = await readFile(resolve(outputDirectory, 'publication-placeholders.json'), 'utf8')
    const secondOutputManifest = await readFile(resolve(outputDirectory, 'publication-output-manifest.json'), 'utf8')
    const { stdout: status } = await runGit('status', '--porcelain=v1', '--untracked-files=all')

    assert.deepEqual(secondAssembly, firstAssembly)
    assert.equal(secondPlaceholderManifest, firstPlaceholderManifest)
    assert.equal(secondOutputManifest, firstOutputManifest)
    assert.equal(marker.commit, sourceIdentity.commit)
    assert.equal(marker.tree, sourceIdentity.tree)
    assert.equal(marker.sourceWorktreeBefore, 'clean')
    assert.equal(marker.sourceWorktreeAfter, 'clean')
    assert.equal(status, '')
    assert.equal(
      await readFile(resolve(portalDirectory, 'cave-corridor'), 'utf8'),
      `${FALLBACK_ROUTE_CONTENTS}\n`,
    )
    assert.equal(sha256(firstPlaceholderManifest), firstAssembly.placeholderManifestSha256)
    assert.equal(sha256(firstOutputManifest), firstAssembly.outputManifestSha256)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('ER-11 rejects a non-sentinel source placeholder without source mutation', async () => {
  const fixture = await createFixture()

  try {
    await writeFile(resolve(fixture.portalDirectory, 'cave-corridor'), 'authored route content\n', 'utf8')

    await assert.rejects(
      assemblePublicationOutput({
        portalDirectory: fixture.portalDirectory,
        outputDirectory: fixture.outputDirectory,
      }),
      /not the fallback sentinel/,
    )
    assert.equal(
      await readFile(resolve(fixture.portalDirectory, 'cave-corridor'), 'utf8'),
      'authored route content\n',
    )
    await assert.rejects(
      readFile(resolve(fixture.outputDirectory, 'publication-routes', 'cave-corridor'), 'utf8'),
      { code: 'ENOENT' },
    )
    await assert.rejects(
      readFile(resolve(fixture.outputDirectory, 'build-marker.json'), 'utf8'),
      { code: 'ENOENT' },
    )
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('refuses placeholder paths outside the Portal source directory', async () => {
  const fixture = await createFixture()

  try {
    await assert.rejects(
      assemblePublicationOutput({
        portalDirectory: fixture.portalDirectory,
        outputDirectory: fixture.outputDirectory,
        placeholderPaths: ['../cave-corridor'],
      }),
      /Invalid publication placeholder path/,
    )
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

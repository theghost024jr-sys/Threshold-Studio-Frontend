import assert from 'node:assert/strict'
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import { createBuildMarker } from '../portal/scripts/build-marker.mjs'
import { writeBuildMarker } from '../portal/scripts/build-marker.mjs'
import { handleRequest } from '../../worker.js'

const commit = '0123456789abcdef0123456789abcdef01234567'
const tree = '89abcdef0123456789abcdef0123456789abcdef'
const assembly = {
  mode: 'isolated-publication-output',
  placeholderManifestSha256: 'a'.repeat(64),
  placeholderCount: 2,
  outputManifestSha256: 'b'.repeat(64),
}

test('creates a v2 marker for a clean source commit and isolated assembly', async () => {
  const marker = await createBuildMarker({
    now: new Date('2026-11-15T06:30:32.000Z'),
    assembly,
    runGitCommand: async (args) => {
      if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
      if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
      if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') return ''
      throw new Error(`Unexpected Git command: ${args.join(' ')}`)
    },
  })

  assert.deepEqual(marker, {
    schema: 'threshold-build-marker/v2',
    commit,
    tree,
    sourceWorktreeBefore: 'clean',
    sourceWorktreeAfter: 'clean',
    assembly,
    builtAtUtc: '2026-11-15T06:30:32.000Z',
  })
})

for (const [label, status] of [
  ['modified tracked file', ' M website/portal/index.html\n'],
  ['staged file', 'M  worker.js\n'],
  ['untracked file', '?? new-attribution-file.mjs\n'],
]) {
  test(`refuses to create a marker from a ${label}`, async () => {
    await assert.rejects(
      createBuildMarker({
        assembly,
        runGitCommand: async (args) => {
          if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
          if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
          if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') return status
          throw new Error(`Unexpected Git command: ${args.join(' ')}`)
        },
      }),
      /dirty source worktree/,
    )
  })
}

test('refuses a marker when source cleanliness changes after assembly', async () => {
  let statusChecks = 0

  await assert.rejects(
    createBuildMarker({
      assembly,
      runGitCommand: async (args) => {
        if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
        if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
        if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') {
          statusChecks += 1
          return statusChecks === 1 ? '' : ' M website/portal/cave-corridor\n'
        }
        throw new Error(`Unexpected Git command: ${args.join(' ')}`)
      },
    }),
    /dirty source worktree/,
  )
})

test('refuses an invalid caller-supplied source identity', async () => {
  await assert.rejects(
    createBuildMarker({
      sourceIdentity: { commit: 'not-a-commit', tree },
      assembly,
    }),
    /invalid source commit hash/,
  )
})

test('removes a stale marker before refusing a dirty build', async () => {
  const outputDirectory = await mkdtemp(resolve(tmpdir(), 'threshold-build-marker-'))
  const markerPath = resolve(outputDirectory, 'build-marker.json')
  await writeFile(markerPath, '{"commit":"stale"}\n', 'utf8')

  try {
    await assert.rejects(
      writeBuildMarker(outputDirectory, {
        assembly,
        runGitCommand: async (args) => {
          if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
          if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
          if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') return '?? untracked-file\n'
          throw new Error(`Unexpected Git command: ${args.join(' ')}`)
        },
      }),
      /dirty source worktree/,
    )

    await assert.rejects(readFile(markerPath, 'utf8'), { code: 'ENOENT' })
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('ER-17 removes temporary and final markers when atomic rename fails', async () => {
  const outputDirectory = await mkdtemp(resolve(tmpdir(), 'threshold-build-marker-'))
  const markerPath = resolve(outputDirectory, 'build-marker.json')
  const temporaryMarkerPath = resolve(outputDirectory, '.build-marker.json.tmp')
  try {
    await assert.rejects(
      writeBuildMarker(outputDirectory, {
        assembly,
        runGitCommand: async (args) => {
          if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
          if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
          if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') return ''
          throw new Error(`Unexpected Git command: ${args.join(' ')}`)
        },
        fileSystem: {
          rm,
          writeFile,
          rename: async () => { throw new Error('rename failed') },
        },
      }),
      /rename failed/,
    )
    await assert.rejects(readFile(markerPath, 'utf8'), { code: 'ENOENT' })
    await assert.rejects(readFile(temporaryMarkerPath, 'utf8'), { code: 'ENOENT' })
  } finally { await rm(outputDirectory, { recursive: true, force: true }) }
})

test('ER-07 finalizes the marker only after source checks and temporary write', async () => {
  const outputDirectory = await mkdtemp(resolve(tmpdir(), 'threshold-build-marker-'))
  const markerPath = resolve(outputDirectory, 'build-marker.json')
  const temporaryMarkerPath = resolve(outputDirectory, '.build-marker.json.tmp')
  const events = []
  try {
    await writeBuildMarker(outputDirectory, {
      assembly,
      runGitCommand: async (args) => {
        events.push(`git:${args.join(' ')}`)
        if (args.join(' ') === 'rev-parse HEAD') return `${commit}\n`
        if (args.join(' ') === `rev-parse ${commit}^{tree}`) return `${tree}\n`
        if (args.join(' ') === 'status --porcelain=v1 --untracked-files=all') return ''
        throw new Error(`Unexpected Git command: ${args.join(' ')}`)
      },
      fileSystem: {
        rm,
        writeFile: async (path, contents, encoding) => {
          events.push('temporary-write')
          await assert.rejects(readFile(markerPath, 'utf8'), { code: 'ENOENT' })
          await writeFile(path, contents, encoding)
        },
        rename: async (from, to) => {
          events.push('atomic-rename')
          assert.equal(from, temporaryMarkerPath)
          assert.equal(to, markerPath)
          await rename(from, to)
        },
      },
    })
    assert.ok(events.indexOf('temporary-write') > events.lastIndexOf('git:status --porcelain=v1 --untracked-files=all'))
    assert.deepEqual(events.slice(-2), ['temporary-write', 'atomic-rename'])
    await readFile(markerPath, 'utf8')
  } finally { await rm(outputDirectory, { recursive: true, force: true }) }
})

test('links the build marker from the Portal shell', async () => {
  const index = await readFile(new URL('../portal/index.html', import.meta.url), 'utf8')

  assert.match(index, /href="\/portal\/build-marker\.json"/)
})

test('serves the marker as JSON and preserves a missing marker response', async () => {
  const assetPaths = []
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const path = new URL(request.url).pathname
        assetPaths.push(path)
        if (path === '/portal-dist/build-marker.json') {
          return new Response('{"schema":"threshold-build-marker/v2"}', {
            headers: { 'content-type': 'application/json; charset=utf-8' },
          })
        }
        return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
      },
    },
  }

  const markerResponse = await handleRequest(
    new Request('https://threshold.example/portal/build-marker.json'),
    env,
    {},
  )
  assert.equal(markerResponse.status, 200)
  assert.equal(markerResponse.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(await markerResponse.text(), '{"schema":"threshold-build-marker/v2"}')
  assert.deepEqual(assetPaths, ['/portal-dist/build-marker.json'])

  const missingResponse = await handleRequest(
    new Request('https://threshold.example/portal/build-marker.json'),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    {},
  )
  assert.equal(missingResponse.status, 404)
  assert.equal(await missingResponse.text(), 'Not found')
})

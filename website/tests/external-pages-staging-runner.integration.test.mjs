import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const runnerFiles = [
  'external-pages-staging-runner.mjs',
  'publication-assembly.mjs',
  'build-marker.mjs',
]
const sourceScripts = new URL('../portal/scripts/', import.meta.url)

async function git(root, ...args) {
  const { stdout } = await execFileAsync('git', ['-C', root, ...args])
  return stdout
}

async function commitFixture(root) {
  await git(root, 'init', '--quiet')
  await git(root, 'config', 'user.name', 'Threshold test')
  await git(root, 'config', 'user.email', 'threshold-test@example.invalid')
  await git(root, 'add', '.')
  await git(root, 'commit', '--quiet', '-m', 'Fixture')
  return {
    commit: (await git(root, 'rev-parse', 'HEAD')).trim(),
    tree: (await git(root, 'rev-parse', 'HEAD^{tree}')).trim(),
  }
}

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'threshold-runner-er-'))
  const candidateRoot = resolve(root, 'candidate')
  const runnerRoot = resolve(root, 'runner')
  const stagingRoot = resolve(root, 'stage')
  await mkdir(resolve(candidateRoot, 'website', 'portal', 'node_modules', '.bin'), { recursive: true })
  await mkdir(resolve(candidateRoot, 'website', 'data'), { recursive: true })
  await mkdir(resolve(candidateRoot, 'tools'), { recursive: true })
  await writeFile(resolve(candidateRoot, '.gitignore'), 'website/data/vault-index.json\nwebsite/data/*.ignored\n')
  await writeFile(resolve(candidateRoot, 'website', 'portal', 'cave-corridor'), 'Portal route fallback.\n')
  await writeFile(resolve(candidateRoot, 'website', 'portal', 'cave-corridor-prototype'), 'Portal route fallback.\n')
  await writeFile(resolve(candidateRoot, 'website', 'portal', 'vite.config.js'), 'export default {}\n')
  await writeFile(resolve(candidateRoot, 'website', 'portal', 'node_modules', '.bin', 'vite.js'), 'process.exit(0)\n')
  await writeFile(resolve(candidateRoot, 'website', 'data', 'threshold-vault.json'), '{"documents":[]}\n')
  await writeFile(resolve(candidateRoot, 'tools', 'generate-index.mjs'), '// fixture generator\n')
  await writeFile(resolve(candidateRoot, 'worker.js'), 'export default {}\n')
  const candidate = await commitFixture(candidateRoot)

  await mkdir(resolve(runnerRoot, 'website', 'portal', 'scripts'), { recursive: true })
  for (const file of runnerFiles) {
    await writeFile(resolve(runnerRoot, 'website', 'portal', 'scripts', file), await readFile(new URL(file, sourceScripts)))
  }
  const runner = await commitFixture(runnerRoot)
  const module = await import(`${pathToFileURL(resolve(runnerRoot, 'website', 'portal', 'scripts', 'external-pages-staging-runner.mjs')).href}?${runner.commit}`)
  return { root, candidateRoot, runnerRoot, stagingRoot, candidate, runner, stageCandidatePages: module.stageCandidatePages }
}

function options(fixture, overrides = {}) {
  return {
    candidateRoot: fixture.candidateRoot,
    runnerRoot: fixture.runnerRoot,
    stagingRoot: fixture.stagingRoot,
    expectedCandidate: fixture.candidate,
    expectedRunner: fixture.runner,
    runnerModulePaths: runnerFiles.map((file) => `website/portal/scripts/${file}`),
    allowedIgnoredInput: {
      relativePath: 'website/data/vault-index.json',
      generatorPath: 'tools/generate-index.mjs',
      async generate({ outputPath }) {
        await writeFile(outputPath, '{"version":1,"count":0}\n')
        return { command: 'fixture-generate-index', documentCount: 0 }
      },
      viteExecutable: 'website/portal/node_modules/.bin/vite.js',
      configPath: 'website/portal/vite.config.js',
    },
    async runVite({ outDir, candidateRoot, viteExecutable, configPath }) {
      assert.equal(await realpath(candidateRoot), await realpath(fixture.candidateRoot))
      assert.ok(viteExecutable.startsWith(candidateRoot))
      assert.ok(configPath.startsWith(candidateRoot))
      await mkdir(outDir, { recursive: true })
      await writeFile(resolve(outDir, 'index.html'), '<!doctype html><title>Fixture</title>\n')
    },
    now: new Date('2026-11-15T08:00:00.000Z'),
    ...overrides,
  }
}

test('ER-01 through ER-07 stage an exact clean candidate externally and reproducibly', async () => {
  const f = await fixture()
  try {
    const first = await f.stageCandidatePages(options(f))
    const status = await git(f.candidateRoot, 'status', '--porcelain=v1', '--untracked-files=all')
    assert.equal(status, '')
    assert.equal(first.candidate.commit, f.candidate.commit)
    assert.equal(JSON.parse(await readFile(first.markerPath, 'utf8')).commit, f.candidate.commit)
    assert.equal(await readFile(resolve(f.candidateRoot, 'website', 'portal', 'cave-corridor'), 'utf8'), 'Portal route fallback.\n')
    assert.equal(await readFile(resolve(f.stagingRoot, 'portal', 'cave-corridor'), 'utf8'), '<!doctype html><title>Fixture</title>\n')
    assert.ok(JSON.parse(await readFile(resolve(f.stagingRoot, 'portal-dist', 'attestation-runner.json'), 'utf8')).runner.modules.length)
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-08 through ER-17 reject invalid roots, identities, inputs, and Vite failures without markers', async () => {
  const f = await fixture()
  try {
    await assert.rejects(f.stageCandidatePages(options(f, { expectedCandidate: { ...f.candidate, commit: '0'.repeat(40) } })), /identity/)
    await assert.rejects(f.stageCandidatePages(options(f, { stagingRoot: f.candidateRoot })), /distinct/)
    await assert.rejects(f.stageCandidatePages(options(f, { runVite: async () => { throw new Error('Vite failed') } })), /Vite failed/)
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('rejects relative roots and incomplete runner-module provenance before Vite', async () => {
  const f = await fixture()
  try {
    let viteCalls = 0
    for (const property of ['candidateRoot', 'runnerRoot', 'stagingRoot']) {
      await assert.rejects(
        f.stageCandidatePages(options(f, {
          [property]: 'relative-root',
          runVite: async () => { viteCalls += 1 },
        })),
        new RegExp(`${property} must be an absolute path`),
      )
    }
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        runnerModulePaths: ['website/portal/scripts/external-pages-staging-runner.mjs'],
        runVite: async () => { viteCalls += 1 },
      })),
      /missing required module/,
    )
    assert.equal(viteCalls, 0)
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('rejects invalid now values before Vite, assembly, or marker creation', async () => {
  const f = await fixture()
  try {
    let viteCalls = 0
    for (const now of [new Date('invalid'), '2026-11-15T08:00:00.000Z', 0, null, undefined]) {
      await assert.rejects(
        f.stageCandidatePages(options(f, {
          now,
          runVite: async () => { viteCalls += 1 },
        })),
        /now must be a valid Date/,
      )
    }
    assert.equal(viteCalls, 0)
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-01 stages an exact candidate with explicit roots and separate runner provenance', async () => {
  const f = await fixture()
  try {
    const gitCalls = []
    const result = await f.stageCandidatePages(options(f, {
      async runGitCommand(call) {
        gitCalls.push(call)
        return git(call.root, ...call.args)
      },
    }))
    const candidateRoot = await realpath(f.candidateRoot)
    const runnerRoot = await realpath(f.runnerRoot)
    assert.ok(gitCalls.some(({ root }) => root === candidateRoot))
    assert.ok(gitCalls.some(({ root }) => root === runnerRoot))
    assert.ok(gitCalls.every(({ root }) => root === candidateRoot || root === runnerRoot))
    assert.deepEqual(result.candidate, f.candidate)
    assert.deepEqual(result.runner, {
      ...f.runner,
      modules: result.runner.modules,
    })
    assert.equal(JSON.parse(await readFile(result.markerPath, 'utf8')).commit, f.candidate.commit)
    for (const manifest of [
      'attestation-runner.json',
      'publication-placeholders.json',
      'publication-output-manifest.json',
    ]) {
      assert.doesNotMatch(
        await readFile(resolve(f.stagingRoot, 'portal-dist', manifest), 'utf8'),
        /[A-Za-z]:[\\/]/,
      )
    }
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-02 keeps the candidate clean before generation and after marker finalization', async () => {
  const f = await fixture()
  try {
    let generationStarted = false
    let cleanStatusBeforeGeneration = false
    const baseOptions = options(f)
    const result = await f.stageCandidatePages(options(f, {
      allowedIgnoredInput: {
        ...baseOptions.allowedIgnoredInput,
        async generate({ outputPath }) {
          generationStarted = true
          await writeFile(outputPath, '{"version":1,"count":0}\n')
          return { command: 'fixture-generate-index', documentCount: 0 }
        },
      },
      async runGitCommand(call) {
        const output = await git(call.root, ...call.args)
        if (
          call.root === await realpath(f.candidateRoot)
          && call.args[0] === 'status'
          && !generationStarted
          && output.trim() === ''
        ) {
          cleanStatusBeforeGeneration = true
        }
        return output
      },
    }))
    assert.equal(cleanStatusBeforeGeneration, true)
    assert.equal(await git(f.candidateRoot, 'status', '--porcelain=v1', '--untracked-files=all'), '')
    await readFile(result.markerPath)
    for (const path of ['cave-corridor', 'cave-corridor-prototype']) {
      assert.equal(
        await readFile(resolve(f.candidateRoot, 'website', 'portal', path), 'utf8'),
        'Portal route fallback.\n',
      )
    }
    for (const path of [
      resolve(f.candidateRoot, 'website', '_worker.js'),
      resolve(f.candidateRoot, 'website', 'portal-dist'),
      resolve(f.candidateRoot, 'website', 'portal', 'publication-placeholders.json'),
      resolve(f.candidateRoot, 'website', 'portal', 'publication-output-manifest.json'),
    ]) {
      await assert.rejects(readFile(path), { code: 'ENOENT' })
    }
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-03 rejects an unexpected ignored candidate data input before Vite', async () => {
  const f = await fixture()
  try {
    let viteCalled = false
    const config = options(f, {
      allowedIgnoredInput: {
        ...options(f).allowedIgnoredInput,
        async generate({ outputPath, candidateRoot }) {
          await writeFile(outputPath, '{}\n')
          await writeFile(resolve(candidateRoot, 'website', 'data', 'unexpected.ignored'), 'unexpected\n')
          return { command: 'fixture-generate-index', documentCount: 0 }
        },
      },
      runVite: async () => { viteCalled = true },
    })
    await assert.rejects(f.stageCandidatePages(config), /unexpected ignored input/)
    assert.equal(viteCalled, false)
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-12 rejects and preserves a preexisting unexpected ignored input before Vite', async () => {
  const f = await fixture()
  try {
    const diagnosticPath = resolve(f.candidateRoot, 'website', 'data', 'diagnostic.ignored')
    let viteCalled = false
    await writeFile(diagnosticPath, 'preserve this diagnostic input\n')
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        runVite: async () => { viteCalled = true },
      })),
      /unexpected ignored inputs before generation/,
    )
    assert.equal(viteCalled, false)
    assert.equal(await readFile(diagnosticPath, 'utf8'), 'preserve this diagnostic input\n')
    await assert.rejects(
      readFile(resolve(f.candidateRoot, 'website', 'data', 'vault-index.json'), 'utf8'),
      { code: 'ENOENT' },
    )
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-14 removes markers after Vite writes partial staging output then fails', async () => {
  const f = await fixture()
  try {
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        async runVite({ outDir }) {
          await mkdir(outDir, { recursive: true })
          await writeFile(resolve(outDir, 'partial-output.txt'), 'partial\n')
          await writeFile(resolve(outDir, '.build-marker.json.tmp'), 'temporary\n')
          throw new Error('partial Vite failure')
        },
      })),
      /partial Vite failure/,
    )
    await readFile(resolve(f.stagingRoot, 'portal-dist', 'partial-output.txt'), 'utf8')
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', '.build-marker.json.tmp'), 'utf8'), { code: 'ENOENT' })
    assert.equal(await git(f.candidateRoot, 'status', '--porcelain=v1', '--untracked-files=all'), '')
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-15 rejects post-assembly candidate mutation and removes the marker', async () => {
  const f = await fixture()
  try {
    let candidateStatusChecks = 0
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        async runGitCommand(call) {
          if (
            call.root === await realpath(f.candidateRoot)
            && call.args.join(' ') === 'status --porcelain=v1 --untracked-files=all'
          ) {
            candidateStatusChecks += 1
            if (candidateStatusChecks === 3) {
              await writeFile(resolve(f.candidateRoot, 'worker.js'), 'export default { changed: true }\n')
            }
          }
          return git(call.root, ...call.args)
        },
      })),
      /dirty source worktree/,
    )
    assert.equal(candidateStatusChecks, 3)
    assert.equal(
      await readFile(resolve(f.candidateRoot, 'website', 'portal', 'cave-corridor'), 'utf8'),
      'Portal route fallback.\n',
    )
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', '.build-marker.json.tmp'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-16 rejects a runner module hash mutation before marker finalization', async () => {
  const f = await fixture()
  try {
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        async runVite({ outDir }) {
          await mkdir(outDir, { recursive: true })
          await writeFile(resolve(outDir, 'index.html'), '<!doctype html><title>Fixture</title>\n')
          await writeFile(
            resolve(f.runnerRoot, 'website', 'portal', 'scripts', 'publication-assembly.mjs'),
            '// changed after runner-module hash capture\n',
          )
        },
      })),
      /Runner module hash changed before marker finalization/,
    )
    assert.equal(await git(f.candidateRoot, 'status', '--porcelain=v1', '--untracked-files=all'), '')
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'), 'utf8'), { code: 'ENOENT' })
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', '.build-marker.json.tmp'), 'utf8'), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-04 captures candidate-local Vite paths and exact external output root', async () => {
  const f = await fixture()
  try {
    let invocation
    const result = await f.stageCandidatePages(options(f, {
      async runVite(call) {
        invocation = call
        await mkdir(call.outDir, { recursive: true })
        await writeFile(resolve(call.outDir, 'index.html'), '<!doctype html><title>Fixture</title>\n')
      },
    }))
    assert.equal(await realpath(invocation.candidateRoot), await realpath(f.candidateRoot))
    assert.equal(await realpath(resolve(invocation.outDir, '..')), await realpath(f.stagingRoot))
    assert.equal(invocation.outDir, resolve(await realpath(f.stagingRoot), 'portal-dist'))
    assert.ok(invocation.viteExecutable.startsWith(await realpath(f.candidateRoot)))
    assert.ok(invocation.configPath.startsWith(await realpath(f.candidateRoot)))
    assert.equal(result.marker.commit, f.candidate.commit)
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-05 writes publication content only to external staging', async () => {
  const f = await fixture()
  try {
    await f.stageCandidatePages(options(f))
    for (const path of [
      resolve(f.stagingRoot, '_worker.js'),
      resolve(f.stagingRoot, 'portal', 'cave-corridor'),
      resolve(f.stagingRoot, 'portal-dist', 'publication-placeholders.json'),
      resolve(f.stagingRoot, 'portal-dist', 'publication-output-manifest.json'),
      resolve(f.stagingRoot, 'portal-dist', 'build-marker.json'),
    ]) {
      await readFile(path)
    }
    for (const path of [
      resolve(f.candidateRoot, 'website', '_worker.js'),
      resolve(f.candidateRoot, 'website', 'portal', 'publication-placeholders.json'),
      resolve(f.candidateRoot, 'website', 'portal', 'publication-output-manifest.json'),
      resolve(f.candidateRoot, 'website', 'portal-dist', 'build-marker.json'),
      resolve(f.candidateRoot, 'website', 'portal-dist', 'portal-shell.txt'),
    ]) {
      await assert.rejects(readFile(path), { code: 'ENOENT' })
    }
    assert.equal(
      await readFile(resolve(f.candidateRoot, 'website', 'portal', 'cave-corridor'), 'utf8'),
      'Portal route fallback.\n',
    )
    assert.equal(
      await git(f.candidateRoot, 'status', '--porcelain=v1', '--untracked-files=all'),
      '',
    )
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-06 repeats unchanged staging with identical provenance manifests', async () => {
  const f = await fixture()
  const secondStage = resolve(f.root, 'stage-two')
  try {
    await f.stageCandidatePages(options(f))
    await f.stageCandidatePages(options(f, { stagingRoot: secondStage, now: new Date('2026-11-15T09:00:00.000Z') }))
    for (const name of ['publication-placeholders.json', 'publication-output-manifest.json', 'attestation-runner.json']) {
      assert.equal(
        await readFile(resolve(f.stagingRoot, 'portal-dist', name), 'utf8'),
        await readFile(resolve(secondStage, 'portal-dist', name), 'utf8'),
      )
    }
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-08 rejects wrong or dirty candidate identity before Vite', async () => {
  const f = await fixture()
  try {
    let viteCalls = 0
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        expectedCandidate: { ...f.candidate, commit: '0'.repeat(40) },
        runVite: async () => { viteCalls += 1 },
      })),
      /Candidate identity/,
    )
    await writeFile(resolve(f.candidateRoot, 'candidate-fault.txt'), 'dirty\n')
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        stagingRoot: resolve(f.root, 'dirty-stage'),
        runVite: async () => { viteCalls += 1 },
      })),
      /Candidate worktree is dirty/,
    )
    assert.equal(viteCalls, 0)
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json')), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-09 rejects wrong, dirty, same-worktree, or aliased runner identity before Vite', async () => {
  const f = await fixture()
  try {
    let viteCalls = 0
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        expectedRunner: { ...f.runner, tree: '0'.repeat(40) },
        runVite: async () => { viteCalls += 1 },
      })),
      /Runner identity/,
    )
    await writeFile(resolve(f.runnerRoot, 'runner-fault.txt'), 'dirty\n')
    await assert.rejects(
      f.stageCandidatePages(options(f, {
        stagingRoot: resolve(f.root, 'dirty-runner-stage'),
        runVite: async () => { viteCalls += 1 },
      })),
      /Runner worktree is dirty/,
    )
    const candidateAliasRunner = resolve(f.root, 'candidate-as-runner')
    await symlink(f.candidateRoot, candidateAliasRunner, 'junction')
    for (const [runnerRoot, stagingRoot] of [
      [f.candidateRoot, resolve(f.root, 'same-worktree-stage')],
      [candidateAliasRunner, resolve(f.root, 'aliased-runner-stage')],
    ]) {
      await assert.rejects(
        f.stageCandidatePages(options(f, {
          runnerRoot,
          stagingRoot,
          runVite: async () => { viteCalls += 1 },
        })),
        /staging roots must be distinct/,
      )
    }
    assert.equal(viteCalls, 0)
    await assert.rejects(readFile(resolve(f.stagingRoot, 'portal-dist', 'build-marker.json')), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('ER-10 rejects existing, nested, and junction-aliased staging roots before Vite', async () => {
  const f = await fixture()
  try {
    let viteCalls = 0
    const existingStage = resolve(f.root, 'existing-stage')
    const candidateNestedStage = resolve(f.candidateRoot, 'nested-stage')
    const runnerNestedStage = resolve(f.runnerRoot, 'nested-stage')
    const candidateAliasStage = resolve(f.root, 'candidate-alias')
    await mkdir(existingStage)
    await symlink(f.candidateRoot, candidateAliasStage, 'junction')

    for (const stagingRoot of [existingStage, candidateNestedStage, runnerNestedStage, candidateAliasStage]) {
      await assert.rejects(
        f.stageCandidatePages(options(f, {
          stagingRoot,
          runVite: async () => { viteCalls += 1 },
        })),
        /staging roots must be distinct|Staging root must not already exist/,
      )
    }

    assert.equal(viteCalls, 0)
    for (const stage of [existingStage, candidateNestedStage, runnerNestedStage, candidateAliasStage]) {
      await assert.rejects(readFile(resolve(stage, 'portal-dist', 'build-marker.json')), { code: 'ENOENT' })
    }
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

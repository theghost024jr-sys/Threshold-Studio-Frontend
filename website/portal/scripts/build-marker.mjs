import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const BUILD_MARKER_SCHEMA = 'threshold-build-marker/v2'
const GIT_HASH_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/

async function runGit(args, repositoryRoot) {
  const { stdout } = await execFileAsync('git', ['-C', repositoryRoot, ...args])
  return stdout
}

function readHash(value, label) {
  const hash = value.trim()
  if (!GIT_HASH_PATTERN.test(hash)) {
    throw new Error(`Git returned an invalid ${label}: ${hash}`)
  }
  return hash
}

function validateAssembly(assembly) {
  if (
    !assembly
    || assembly.mode !== 'isolated-publication-output'
    || !SHA256_PATTERN.test(assembly.placeholderManifestSha256)
    || !Number.isSafeInteger(assembly.placeholderCount)
    || assembly.placeholderCount < 0
    || !SHA256_PATTERN.test(assembly.outputManifestSha256)
  ) {
    throw new Error('Build marker requires valid isolated assembly provenance.')
  }
}

function validateSourceIdentity(sourceIdentity) {
  if (!sourceIdentity || typeof sourceIdentity !== 'object') {
    throw new Error('Build marker requires a valid clean source identity.')
  }

  return {
    commit: readHash(sourceIdentity.commit ?? '', 'source commit hash'),
    tree: readHash(sourceIdentity.tree ?? '', 'source tree hash'),
  }
}

export async function readCleanSourceIdentity({
  repositoryRoot = resolve(import.meta.dirname, '../../..'),
  runGitCommand = runGit,
} = {}) {
  const commit = readHash(await runGitCommand(['rev-parse', 'HEAD'], repositoryRoot), 'commit hash')
  const tree = readHash(await runGitCommand(['rev-parse', `${commit}^{tree}`], repositoryRoot), 'tree hash')
  const status = await runGitCommand(['status', '--porcelain=v1', '--untracked-files=all'], repositoryRoot)

  if (status.trim() !== '') {
    throw new Error('Cannot create a build marker from a dirty source worktree.')
  }

  return {
    commit,
    tree,
  }
}

export async function createBuildMarker({
  sourceIdentity,
  assembly,
  repositoryRoot = resolve(import.meta.dirname, '../../..'),
  now = new Date(),
  runGitCommand = runGit,
} = {}) {
  validateAssembly(assembly)
  const sourceBefore = sourceIdentity
    ? validateSourceIdentity(sourceIdentity)
    : await readCleanSourceIdentity({ repositoryRoot, runGitCommand })
  const sourceAfter = await readCleanSourceIdentity({ repositoryRoot, runGitCommand })

  if (
    sourceBefore.commit !== sourceAfter.commit
    || sourceBefore.tree !== sourceAfter.tree
  ) {
    throw new Error('Source identity changed during publication assembly.')
  }

  return {
    schema: BUILD_MARKER_SCHEMA,
    commit: sourceBefore.commit,
    tree: sourceBefore.tree,
    sourceWorktreeBefore: 'clean',
    sourceWorktreeAfter: 'clean',
    assembly,
    builtAtUtc: now.toISOString(),
  }
}

export async function writeBuildMarker(outputDirectory, options) {
  const markerPath = resolve(outputDirectory, 'build-marker.json')
  await rm(markerPath, { force: true })
  const marker = await createBuildMarker(options)
  await writeFile(
    markerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8',
  )
  return marker
}

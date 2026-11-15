import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const BUILD_MARKER_SCHEMA = 'threshold-build-marker/v1'
const GIT_HASH_PATTERN = /^[0-9a-f]{40}$/

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

export async function createBuildMarker({
  repositoryRoot = resolve(import.meta.dirname, '../../..'),
  now = new Date(),
  runGitCommand = runGit,
} = {}) {
  const commit = readHash(await runGitCommand(['rev-parse', 'HEAD'], repositoryRoot), 'commit hash')
  const tree = readHash(await runGitCommand(['rev-parse', `${commit}^{tree}`], repositoryRoot), 'tree hash')
  const status = await runGitCommand(['status', '--porcelain=v1', '--untracked-files=all'], repositoryRoot)

  if (status.trim() !== '') {
    throw new Error('Cannot create a build marker from a dirty worktree.')
  }

  return {
    schema: BUILD_MARKER_SCHEMA,
    commit,
    tree,
    worktree: 'clean',
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

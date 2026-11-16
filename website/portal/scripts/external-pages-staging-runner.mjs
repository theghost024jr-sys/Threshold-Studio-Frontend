import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

import { readCleanSourceIdentity, writeBuildMarker } from './build-marker.mjs'
import { assemblePublicationOutput } from './publication-assembly.mjs'

const execFileAsync = promisify(execFile)
const HASH_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const IGNORED_INDEX_PATH = 'website/data/vault-index.json'
const WEBSITE_COPY_EXCLUSIONS = new Set(['portal-dist', '_worker.js'])
const REQUIRED_RUNNER_MODULES = [
  'website/portal/scripts/external-pages-staging-runner.mjs',
  'website/portal/scripts/publication-assembly.mjs',
  'website/portal/scripts/build-marker.mjs',
]

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

function ensureHash(value, label) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return value
}

function ensureSha256(value, label) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return value
}

function isWithin(path, root) {
  const fromRoot = relative(root, path)
  return fromRoot === '' || (!fromRoot.startsWith(`..${sep}`) && fromRoot !== '..')
}

export function validateManifestPath(path, label) {
  if (
    typeof path !== 'string'
    || !path
    || isAbsolute(path)
    || path.includes('\\')
    || path.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Invalid ${label} manifest path: ${path}`)
  }
}

function parseManifest(contents, label) {
  try {
    return JSON.parse(contents)
  } catch (error) {
    throw new Error(`Invalid ${label} manifest JSON.`, { cause: error })
  }
}

export function validateAssemblyProvenance({ assembly, placeholderManifestContents, outputManifestContents }) {
  ensureSha256(assembly?.placeholderManifestSha256, 'placeholder manifest hash')
  ensureSha256(assembly?.outputManifestSha256, 'output manifest hash')
  if (sha256(placeholderManifestContents) !== assembly.placeholderManifestSha256) {
    throw new Error('Placeholder manifest hash does not match assembly provenance.')
  }
  if (sha256(outputManifestContents) !== assembly.outputManifestSha256) {
    throw new Error('Output manifest hash does not match assembly provenance.')
  }
  const placeholders = parseManifest(placeholderManifestContents, 'placeholder')
  const output = parseManifest(outputManifestContents, 'output')
  if (placeholders.schema !== 'threshold-publication-placeholders/v1' || !Array.isArray(placeholders.entries)) {
    throw new Error('Invalid placeholder manifest structure.')
  }
  if (output.schema !== 'threshold-publication-output/v1' || !output.portalShell || !Array.isArray(output.routes)) {
    throw new Error('Invalid output manifest structure.')
  }
  for (const entry of placeholders.entries) {
    validateManifestPath(entry.sourcePath, 'placeholder source')
    validateManifestPath(entry.outputPath, 'placeholder output')
    ensureSha256(entry.sourceSha256, 'placeholder source hash')
    ensureSha256(entry.outputSha256, 'placeholder output hash')
  }
  validateManifestPath(output.portalShell.outputPath, 'portal shell')
  ensureSha256(output.portalShell.outputSha256, 'portal shell hash')
  for (const route of output.routes) {
    validateManifestPath(route.outputPath, 'route output')
    ensureSha256(route.outputSha256, 'route output hash')
  }
}

export function validateRunnerProvenance(provenance) {
  if (
    !provenance
    || provenance.schema !== 'threshold-attestation-runner/v1'
    || Object.hasOwn(provenance, 'builtAtUtc')
    || Object.hasOwn(provenance, 'timestamp')
    || !Array.isArray(provenance.runner?.modules)
  ) {
    throw new Error('Invalid runner provenance.')
  }
  for (const module of provenance.runner.modules) {
    validateManifestPath(module.path, 'runner module')
    ensureSha256(module.sha256, 'runner module hash')
  }
}

async function verifyRunnerModuleHashes(runnerRoot, modules) {
  for (const module of modules) {
    const modulePath = resolve(runnerRoot, module.path)
    if (!isWithin(modulePath, runnerRoot) || sha256(await readFile(modulePath)) !== module.sha256) {
      throw new Error(`Runner module hash changed before marker finalization: ${module.path}`)
    }
  }
}

async function defaultGitCommand({ root, args }) {
  const { stdout } = await execFileAsync('git', ['-C', root, ...args])
  return stdout
}

async function canonicalRoot(root, label) {
  if (typeof root !== 'string' || !isAbsolute(root)) throw new Error(`${label} must be an absolute path.`)
  return realpath(root)
}

async function canonicalPathWithExistingParent(path, label) {
  if (typeof path !== 'string' || !isAbsolute(path)) throw new Error(`${label} must be an absolute path.`)
  let probe = resolve(path)
  const missingSegments = []
  while (true) {
    try {
      return resolve(await realpath(probe), ...missingSegments)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      const parent = dirname(probe)
      if (parent === probe) throw error
      missingSegments.unshift(basename(probe))
      probe = parent
    }
  }
}

async function verifyRepository({ root, expected, label, runGitCommand }) {
  const topLevel = (await runGitCommand({ root, args: ['rev-parse', '--show-toplevel'] })).trim()
  if (await realpath(topLevel) !== root) throw new Error(`${label} root is not its Git top-level.`)
  const commit = ensureHash((await runGitCommand({ root, args: ['rev-parse', 'HEAD'] })).trim(), `${label} commit`)
  const tree = ensureHash((await runGitCommand({ root, args: ['rev-parse', `${commit}^{tree}`] })).trim(), `${label} tree`)
  if (commit !== expected.commit || tree !== expected.tree) throw new Error(`${label} identity does not match expected commit/tree.`)
  const status = await runGitCommand({ root, args: ['status', '--porcelain=v1', '--untracked-files=all'] })
  if (status.trim()) throw new Error(`${label} worktree is dirty.`)
  return { commit, tree }
}

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (WEBSITE_COPY_EXCLUSIONS.has(entry.name)) continue
    const sourcePath = resolve(source, entry.name)
    const destinationPath = resolve(destination, entry.name)
    const stat = await lstat(sourcePath)
    if (stat.isSymbolicLink()) throw new Error(`Publication source symlink is not allowed: ${sourcePath}`)
    if (stat.isDirectory()) await copyDirectory(sourcePath, destinationPath)
    else if (stat.isFile()) await copyFile(sourcePath, destinationPath)
    else throw new Error(`Unsupported publication source entry: ${sourcePath}`)
  }
}

async function ignoredEntries(candidateRoot, runGitCommand) {
  const status = await runGitCommand({
    root: candidateRoot,
    args: ['status', '--ignored', '--porcelain=v1', '--', 'website/data'],
  })
  return status.split(/\r?\n/).filter((line) => line.startsWith('!! ')).map((line) => line.slice(3).replaceAll('\\', '/')).sort()
}

export async function runCandidateVite({
  candidateRoot,
  stagingRoot,
  viteExecutable,
  configPath,
  outDir,
  args = [],
  command,
  script,
}) {
  if (
    !isWithin(viteExecutable, candidateRoot)
    || !isWithin(configPath, candidateRoot)
    || typeof outDir !== 'string'
    || !outDir
    || typeof stagingRoot !== 'string'
    || resolve(outDir) !== resolve(stagingRoot, 'portal-dist')
    || !Array.isArray(args)
    || args.length > 0
    || command !== undefined
    || script !== undefined
  ) {
    throw new Error('Candidate Vite executable, config, and output paths must be explicit.')
  }
  await execFileAsync(process.execPath, [viteExecutable, 'build', '--config', configPath, '--outDir', outDir, ...args], {
    cwd: candidateRoot,
  })
}

export async function stageCandidatePages({
  candidateRoot,
  runnerRoot,
  stagingRoot,
  expectedCandidate,
  expectedRunner,
  allowedIgnoredInput,
  runnerModulePaths,
  runGitCommand = defaultGitCommand,
  runVite = runCandidateVite,
  now,
}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('now must be a valid Date.')
  }
  const candidate = await canonicalRoot(candidateRoot, 'candidateRoot')
  const runner = await canonicalRoot(runnerRoot, 'runnerRoot')
  const stage = await canonicalPathWithExistingParent(stagingRoot, 'stagingRoot')
  if (candidate === runner || isWithin(stage, candidate) || isWithin(stage, runner)) {
    throw new Error('Candidate, runner, and staging roots must be distinct.')
  }
  try {
    await lstat(stage)
    throw new Error('Staging root must not already exist.')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const candidateIdentity = await verifyRepository({ root: candidate, expected: expectedCandidate, label: 'Candidate', runGitCommand })
  const runnerIdentity = await verifyRepository({ root: runner, expected: expectedRunner, label: 'Runner', runGitCommand })
  if (!Array.isArray(runnerModulePaths) || runnerModulePaths.length === 0) throw new Error('Runner module paths are required.')
  const declaredModules = new Set(runnerModulePaths.map((modulePath) => modulePath.replaceAll('\\', '/')))
  for (const requiredModule of REQUIRED_RUNNER_MODULES) {
    if (!declaredModules.has(requiredModule)) {
      throw new Error(`Runner module paths are missing required module: ${requiredModule}`)
    }
  }
  const modules = []
  for (const modulePath of [...runnerModulePaths].sort()) {
    const absolutePath = resolve(runner, modulePath)
    if (!isWithin(absolutePath, runner)) throw new Error(`Runner module escapes runner root: ${modulePath}`)
    modules.push({ path: modulePath.replaceAll('\\', '/'), sha256: sha256(await readFile(absolutePath)) })
  }

  if (!allowedIgnoredInput || allowedIgnoredInput.relativePath !== IGNORED_INDEX_PATH || typeof allowedIgnoredInput.generate !== 'function') {
    throw new Error(`Only ${IGNORED_INDEX_PATH} may be generated as an ignored input.`)
  }
  const ignoredBefore = await ignoredEntries(candidate, runGitCommand)
  if (ignoredBefore.some((path) => path !== IGNORED_INDEX_PATH)) {
    throw new Error('Candidate data directory has unexpected ignored inputs before generation.')
  }
  const inputPath = resolve(candidate, IGNORED_INDEX_PATH)
  const publicVaultPath = resolve(candidate, 'website/data/threshold-vault.json')
  const generatorPath = resolve(candidate, allowedIgnoredInput.generatorPath)
  if (!isWithin(inputPath, candidate) || !isWithin(generatorPath, candidate)) throw new Error('Ignored-input paths must remain inside candidate root.')
  const generation = await allowedIgnoredInput.generate({ candidateRoot: candidate, outputPath: inputPath })
  const ignoredAfter = await ignoredEntries(candidate, runGitCommand)
  if (ignoredAfter.length !== 1 || ignoredAfter[0] !== IGNORED_INDEX_PATH) throw new Error('Candidate generated an unexpected ignored input.')
  const sourceIdentity = await readCleanSourceIdentity({
    repositoryRoot: candidate,
    runGitCommand: (args, root) => runGitCommand({ root, args }),
  })

  await mkdir(stage, { recursive: true })
  const stageWebsite = stage
  const stagePortalDist = resolve(stageWebsite, 'portal-dist')
  const candidateWebsite = resolve(candidate, 'website')
  const candidatePortal = resolve(candidateWebsite, 'portal')
  const viteExecutable = resolve(candidate, allowedIgnoredInput.viteExecutable)
  const configPath = resolve(candidate, allowedIgnoredInput.configPath)

  try {
    await copyDirectory(candidateWebsite, stageWebsite)
    await runVite({ candidateRoot: candidate, stagingRoot: stageWebsite, viteExecutable, configPath, outDir: stagePortalDist })
    await copyFile(resolve(stagePortalDist, 'index.html'), resolve(stagePortalDist, 'portal-shell.txt'))
    await copyFile(resolve(candidate, 'worker.js'), resolve(stageWebsite, '_worker.js'))

    const assembly = await assemblePublicationOutput({
      portalDirectory: candidatePortal,
      outputDirectory: stagePortalDist,
      publicationDirectory: resolve(stageWebsite, 'portal'),
      manifestDirectory: stagePortalDist,
      sourcePathPrefix: 'website/portal',
      outputPathPrefix: 'portal',
      portalShellOutputPath: 'portal-dist/portal-shell.txt',
    })
    const runnerProvenance = {
      schema: 'threshold-attestation-runner/v1',
      candidate: candidateIdentity,
      runner: { ...runnerIdentity, modules },
      ignoredInput: {
        path: IGNORED_INDEX_PATH,
        command: generation.command,
        documentCount: generation.documentCount,
        sourceSha256: sha256(await readFile(publicVaultPath)),
        outputSha256: sha256(await readFile(inputPath)),
        generatorSha256: sha256(await readFile(generatorPath)),
      },
    }
    await writeFile(resolve(stagePortalDist, 'attestation-runner.json'), `${JSON.stringify(runnerProvenance, null, 2)}\n`)
    validateAssemblyProvenance({
      assembly,
      placeholderManifestContents: await readFile(resolve(stagePortalDist, 'publication-placeholders.json')),
      outputManifestContents: await readFile(resolve(stagePortalDist, 'publication-output-manifest.json')),
    })
    validateRunnerProvenance(runnerProvenance)
    await verifyRunnerModuleHashes(runner, modules)
    const marker = await writeBuildMarker(stagePortalDist, {
      sourceIdentity,
      assembly,
      repositoryRoot: candidate,
      now,
      runGitCommand: (args, root) => runGitCommand({ root, args }),
    })
    await readCleanSourceIdentity({
      repositoryRoot: candidate,
      runGitCommand: (args, root) => runGitCommand({ root, args }),
    })
    return { candidate: candidateIdentity, runner: runnerProvenance.runner, ignoredInput: runnerProvenance.ignoredInput, assembly, stagingRoot: stage, markerPath: resolve(stagePortalDist, 'build-marker.json'), marker }
  } catch (error) {
    await rm(resolve(stagePortalDist, 'build-marker.json'), { force: true })
    await rm(resolve(stagePortalDist, '.build-marker.json.tmp'), { force: true })
    throw error
  }
}

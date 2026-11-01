import { documents } from '../../../data/threshold-vault.json'

function requireDocumentShape(document) {
  return document
    && typeof document.id === 'string'
    && typeof document.title === 'string'
    && typeof document.body === 'string'
}

export function getVaultDocument(id) {
  if (!Array.isArray(documents)) {
    throw new Error('Generated vault data does not contain documents.')
  }

  const document = documents.find((candidate) => candidate.id === id)
  if (!requireDocumentShape(document)) {
    throw new Error(`Generated vault data does not contain a valid "${id}" record.`)
  }

  return document
}

export function vaultSummary(document) {
  const lines = document.body
    .replace(/^#.*$/gm, '')
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const summary = lines.find((line) => line !== 'Essence')
  if (!summary) {
    throw new Error(`Vault record "${document.id}" does not contain readable body text.`)
  }

  return summary
}

export function vaultNumberedSection(document, heading, nextHeading) {
  const sectionStart = document.body.indexOf(`${heading}\n`)
  const sectionEnd = document.body.indexOf(`\n${nextHeading}\n`, sectionStart)
  if (sectionStart < 0 || sectionEnd < 0) {
    throw new Error(`Vault record "${document.id}" does not contain the "${heading}" section.`)
  }

  const section = document.body.slice(sectionStart + heading.length + 1, sectionEnd)
  const entries = Array.from(section.matchAll(/^(\d+)\.\s+([^\n]+)\n([\s\S]*?)(?=^\d+\.|(?![\s\S]))/gm))
    .map((match) => ({
      number: match[1],
      name: match[2].trim(),
      detail: match[3].trim().split('\n').find(Boolean)?.trim(),
    }))
    .filter((entry) => entry.detail)

  if (!entries.length) {
    throw new Error(`Vault record "${document.id}" has no readable "${heading}" entries.`)
  }

  return entries
}

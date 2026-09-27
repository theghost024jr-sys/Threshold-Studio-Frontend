import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outputDirectory = resolve(import.meta.dirname, '../../portal-dist')

await copyFile(
  resolve(outputDirectory, 'index.html'),
  resolve(outputDirectory, 'portal-shell.txt'),
)
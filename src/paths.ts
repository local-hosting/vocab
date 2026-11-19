import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function packageRoot(): string {
  return pkgRoot
}

export function packDir(packId: string): string {
  return path.join(pkgRoot, 'packs', packId)
}

function distPackDir(packId: string): string {
  return path.join(pkgRoot, 'dist', 'packs', packId)
}

export function vocabularyPath(packId: string): string {
  const built = path.join(distPackDir(packId), 'vocabulary.yml')
  if (fs.existsSync(built)) return built
  return path.join(packDir(packId), 'vocabulary.yml')
}

export function manifestPath(packId: string): string {
  const built = path.join(distPackDir(packId), 'manifest.yml')
  if (fs.existsSync(built)) return built
  return path.join(packDir(packId), 'manifest.yml')
}

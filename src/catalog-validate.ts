import fs from 'node:fs'
import path from 'node:path'
import { packageRoot } from './paths.js'
import { readYamlFile } from './yaml-io.js'
import type { PackId } from './compile-pack.js'

type CatalogFile = {
  packs: Array<{ id: string }>
}

export function catalogPackIds(): PackId[] {
  const file = path.join(packageRoot(), 'catalog', 'packs.yml')
  if (!fs.existsSync(file)) return []
  const doc = readYamlFile<CatalogFile>(file)
  return doc.packs.map((p) => p.id) as PackId[]
}

export function assertCatalogMatchesPackDirs(packIds: readonly PackId[]): string[] {
  const issues: string[] = []
  const catalogIds = new Set(catalogPackIds())
  for (const id of packIds) {
    if (!catalogIds.has(id)) {
      issues.push(`pack ${id} missing from catalog/packs.yml`)
    }
  }
  for (const id of catalogIds) {
    if (!packIds.includes(id as PackId)) {
      issues.push(`catalog lists unknown pack ${id}`)
    }
  }
  const packsRoot = path.join(packageRoot(), 'packs')
  for (const entry of fs.readdirSync(packsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
  }
  return issues
}
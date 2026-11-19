import fs from 'node:fs'
import path from 'node:path'
import { packageRoot } from './paths.js'
import { readYamlFile } from './yaml-io.js'
import { catalogPackIds } from './catalog-validate.js'

type CatalogFile = {
  packs: Array<{ id: string; owner?: string }>
}

type PackHeader = {
  pack: { id: string }
  languages?: string[]
}

export function assertCommunityPacksEnSpineOnly(): string[] {
  const catalogPath = path.join(packageRoot(), 'catalog', 'packs.yml')
  if (!fs.existsSync(catalogPath)) return []
  const catalog = readYamlFile<CatalogFile>(catalogPath)
  const community = new Set(
    catalog.packs.filter((p) => p.owner === 'community').map((p) => p.id),
  )
  if (community.size === 0) return []

  const issues: string[] = []
  for (const id of catalogPackIds()) {
    if (!community.has(id)) continue
    const header = readYamlFile<PackHeader>(path.join(packageRoot(), 'packs', id, 'pack.yml'))
    const langs = header.languages ?? ['en']
    const extra = langs.filter((l) => l !== 'en')
    if (extra.length > 0) {
      issues.push(
        `community pack ${id} must be en-only in pack.yml languages (found: ${langs.join(', ')})`,
      )
    }
  }
  return issues
}
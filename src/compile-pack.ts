import fs from 'node:fs'
import path from 'node:path'
import type {
  PackManifest,
  SupportedLanguage,
  Vocabulary,
  VocabDefaults,
} from './types/vocabulary.js'
import type { VocabPackSource } from './types/pack-source.js'
import { buildPackInventory } from './inventory.js'
import { mergeLocalesIntoVocabulary } from './merge-locales.js'
import { packDir, packageRoot } from './paths.js'
import { readYamlFile, writeYamlFile } from './yaml-io.js'

export const PACK_IDS = ['city-default', 'resilience'] as const

export type PackId = (typeof PACK_IDS)[number]

type VocabularyPartial = Partial<Vocabulary> & {
  events?: Vocabulary['events']
  actions?: Vocabulary['actions']
  places?: Vocabulary['places']
  resources?: Vocabulary['resources']
  actors?: Vocabulary['actors']
  defaults?: VocabDefaults
}

function mergeById<T extends { id: string }>(base: T[], overlay: T[] | undefined): T[] {
  if (!overlay?.length) return [...base]
  const map = new Map<string, T>()
  for (const row of base) map.set(row.id, { ...row })
  for (const row of overlay) {
    const prev = map.get(row.id)
    map.set(row.id, prev ? { ...prev, ...row } : { ...row })
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id))
}

function mergeDefaults(base: VocabDefaults, overlay: VocabDefaults | undefined): VocabDefaults {
  if (!overlay) return { ...base }
  const out: VocabDefaults = { ...base }
  for (const [eventRef, bands] of Object.entries(overlay)) {
    out[eventRef] = { ...(out[eventRef] ?? {}), ...bands }
  }
  return out
}

export function mergeVocabulary(base: Vocabulary, overlay: VocabularyPartial): Vocabulary {
  return {
    vocab_version: overlay.vocab_version ?? base.vocab_version,
    languages: overlay.languages?.length ? [...overlay.languages] : [...base.languages],
    events: mergeById(base.events, overlay.events),
    actions: mergeById(base.actions, overlay.actions),
    places: mergeById(base.places, overlay.places),
    resources: mergeById(base.resources, overlay.resources),
    actors: mergeById(base.actors, overlay.actors),
    defaults: mergeDefaults(base.defaults, overlay.defaults),
  }
}

export function loadPackSource(packId: PackId): VocabPackSource {
  const file = path.join(packDir(packId), 'pack.yml')
  return readYamlFile<VocabPackSource>(file)
}

export function loadVocabularyYaml(packId: PackId): VocabularyPartial {
  const file = path.join(packDir(packId), 'vocabulary.yml')
  return readYamlFile<VocabularyPartial>(file)
}

export function compilePack(packId: PackId): { manifest: PackManifest; vocabulary: Vocabulary } {
  const source = loadPackSource(packId)
  const partial = loadVocabularyYaml(packId)
  const meta = source.pack

  let vocabulary: Vocabulary
  const baseExtends = meta.extends

  if (baseExtends) {
    if (!PACK_IDS.includes(baseExtends as PackId)) {
      throw new Error(`pack ${packId}: unknown extends ${baseExtends}`)
    }
    const base = compilePack(baseExtends as PackId).vocabulary
    vocabulary = mergeVocabulary(base, {
      ...partial,
      vocab_version: meta.vocab_version ?? meta.version,
      languages: source.languages as SupportedLanguage[],
    })
  } else {
    if (!partial.events || !partial.actions || !partial.places || !partial.resources || !partial.actors) {
      throw new Error(`pack ${packId}: root pack must define all lanes in vocabulary.yml`)
    }
    vocabulary = {
      vocab_version: meta.vocab_version ?? meta.version,
      languages: source.languages as Vocabulary['languages'],
      events: partial.events,
      actions: partial.actions,
      places: partial.places,
      resources: partial.resources,
      actors: partial.actors,
      defaults: partial.defaults ?? {},
    }
  }

  vocabulary = mergeLocalesIntoVocabulary(vocabulary)

  const manifest: PackManifest = {
    id: meta.id,
    mode: meta.mode ?? null,
    vocab_version: vocabulary.vocab_version,
    description: meta.description ?? '',
    min_compose: meta.min_compose,
    extends: baseExtends ?? null,
  }

  return { manifest, vocabulary }
}

export function writeCompiledPacks(): void {
  const outRoot = path.join(packageRoot(), 'dist', 'packs')
  fs.mkdirSync(outRoot, { recursive: true })

  for (const packId of PACK_IDS) {
    const { manifest, vocabulary } = compilePack(packId)
    const dir = path.join(outRoot, packId)
    fs.mkdirSync(dir, { recursive: true })
    writeYamlFile(path.join(dir, 'manifest.yml'), manifest)
    writeYamlFile(path.join(dir, 'vocabulary.yml'), vocabulary)
    writeYamlFile(path.join(dir, 'inventory.yml'), buildPackInventory(manifest, vocabulary))
  }
}

export function listPacks(): PackId[] {
  return [...PACK_IDS]
}
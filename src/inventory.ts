import type { SupportedLanguage, Vocabulary } from '@local-hosting/compose'
import { SUPPORTED_LANGUAGES } from '@local-hosting/compose'
import type { PackManifest } from './types/vocabulary.js'
import type { PackMode } from './types/pack-source.js'

export type InventoryRow = {
  id: string
  lane: 'event' | 'action' | 'place' | 'resource' | 'actor'
  code?: number
  labels: SupportedLanguage[]
  missing: SupportedLanguage[]
}

export type PackInventory = {
  inventory: {
    pack: string
    mode: PackMode | null
    vocab_version: string
    extends: string | null
    counts: Record<string, number>
    languages: {
      declared: SupportedLanguage[]
      complete: SupportedLanguage[]
      partial: SupportedLanguage[]
      missing: SupportedLanguage[]
    }
    rows: InventoryRow[]
  }
}

function laneRows(vocab: Vocabulary) {
  return [
    ...vocab.events.map((r) => ({ ...r, lane: 'event' as const })),
    ...vocab.actions.map((r) => ({ ...r, lane: 'action' as const })),
    ...vocab.places.map((r) => ({ ...r, lane: 'place' as const })),
    ...vocab.resources.map((r) => ({ ...r, lane: 'resource' as const })),
    ...vocab.actors.map((r) => ({ ...r, lane: 'actor' as const })),
  ]
}

export function buildPackInventory(
  manifest: PackManifest,
  vocabulary: Vocabulary,
): PackInventory {
  const rows: InventoryRow[] = []
  const declared = vocabulary.languages
  const complete = new Set<SupportedLanguage>()
  const partial = new Set<SupportedLanguage>()

  for (const lang of declared) {
    let filled = 0
    let total = 0
    for (const row of laneRows(vocabulary)) {
      total++
      if (row.labels[lang]?.trim()) filled++
    }
    if (filled === total && total > 0) complete.add(lang)
    else if (filled > 0) partial.add(lang)
  }

  const missingLangs = SUPPORTED_LANGUAGES.filter(
    (lang) => !declared.includes(lang),
  )

  for (const row of laneRows(vocabulary)) {
    const present: SupportedLanguage[] = []
    const missing: SupportedLanguage[] = []
    for (const lang of declared) {
      if (row.labels[lang]?.trim()) present.push(lang)
      else missing.push(lang)
    }
    rows.push({
      id: row.id,
      lane: row.lane,
      code: row.code,
      labels: present,
      missing,
    })
  }
  rows.sort((a, b) => a.id.localeCompare(b.id))

  return {
    inventory: {
      pack: manifest.id,
      mode: manifest.mode ?? null,
      vocab_version: vocabulary.vocab_version,
      extends: manifest.extends ?? null,
      counts: {
        events: vocabulary.events.length,
        actions: vocabulary.actions.length,
        places: vocabulary.places.length,
        resources: vocabulary.resources.length,
        actors: vocabulary.actors.length,
      },
      languages: {
        declared: [...declared],
        complete: [...complete],
        partial: [...partial],
        missing: missingLangs,
      },
      rows,
    },
  }
}
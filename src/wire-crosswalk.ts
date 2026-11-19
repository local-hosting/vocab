import type { LabelMap, Vocabulary } from './types/vocabulary.js'

/** Rows for `@local-hosting/compose` `mergeCrosswalkIntoTable` (frames field: `legacy_code`). */
export type ComposeCrosswalkRow = {
  legacy_code: string
  id: string
  code: number
  kind: 'resource'
  category?: string
  subcategory?: string
  labels?: LabelMap
}

export function wireCrosswalkForCompose(vocab: Vocabulary): ComposeCrosswalkRow[] {
  const rows: ComposeCrosswalkRow[] = []
  for (const resource of vocab.resources) {
    const wire = resource.wire_code?.trim().toUpperCase()
    if (!wire || resource.code === undefined) continue
    rows.push({
      legacy_code: wire,
      id: resource.id,
      code: resource.code,
      kind: 'resource',
      category: resource.category,
      subcategory: resource.subcategory,
      labels: resource.labels,
    })
  }
  return rows
}
import type { Vocabulary } from './types/vocabulary.js'

export type SemanticIssue = { path: string; message: string }

function allRows(vocab: Vocabulary) {
  return [
    ...vocab.events.map((r) => ({ ...r, lane: 'events' as const })),
    ...vocab.actions.map((r) => ({ ...r, lane: 'actions' as const })),
    ...vocab.places.map((r) => ({ ...r, lane: 'places' as const })),
    ...vocab.resources.map((r) => ({ ...r, lane: 'resources' as const })),
    ...vocab.actors.map((r) => ({ ...r, lane: 'actors' as const })),
  ]
}

/** Referential + wire rules beyond JSON Schema. */
export function validateVocabularySemantics(vocab: Vocabulary): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const ids = new Set<string>()
  const codes = new Map<number, string>()

  for (const row of allRows(vocab)) {
    if (ids.has(row.id)) {
      issues.push({ path: row.lane, message: `duplicate id ${row.id}` })
    }
    ids.add(row.id)

    if (row.code !== undefined) {
      const prev = codes.get(row.code)
      if (prev) {
        issues.push({
          path: row.lane,
          message: `duplicate wire code ${row.code} (${prev} and ${row.id})`,
        })
      }
      codes.set(row.code, row.id)
    }

    if (vocab.languages.includes('en') && !row.labels.en) {
      issues.push({
        path: `${row.lane}/${row.id}`,
        message: 'missing labels.en (required when en is in languages)',
      })
    }
  }

  const eventIds = new Set(vocab.events.map((e) => e.id))
  for (const action of vocab.actions) {
    for (const ref of action.events) {
      if (!eventIds.has(ref)) {
        issues.push({
          path: `actions/${action.id}`,
          message: `unknown event ref ${ref}`,
        })
      }
    }
  }

  const placeIds = new Set(vocab.places.map((p) => p.id))
  const wireCodes = new Map<string, string>()
  for (const resource of vocab.resources) {
    if (resource.place_id && !placeIds.has(resource.place_id)) {
      issues.push({
        path: `resources/${resource.id}`,
        message: `unknown place_id ${resource.place_id}`,
      })
    }
    const wire = resource.wire_code?.trim().toUpperCase()
    if (wire) {
      if (resource.code === undefined) {
        issues.push({
          path: `resources/${resource.id}`,
          message: `wire_code ${wire} requires numeric code`,
        })
      }
      const prev = wireCodes.get(wire)
      if (prev) {
        issues.push({
          path: `resources/${resource.id}`,
          message: `duplicate wire_code ${wire} (${prev} and ${resource.id})`,
        })
      }
      wireCodes.set(wire, resource.id)
    }
  }

  for (const [eventRef, bands] of Object.entries(vocab.defaults)) {
    if (!eventIds.has(eventRef)) {
      issues.push({ path: 'defaults', message: `unknown event ref ${eventRef}` })
    }
    const actionIds = new Set(vocab.actions.map((a) => a.id))
    for (const actionList of Object.values(bands)) {
      for (const actionId of actionList) {
        if (!actionIds.has(actionId)) {
          issues.push({
            path: `defaults/${eventRef}`,
            message: `unknown action id ${actionId}`,
          })
        }
      }
    }
  }

  return issues
}
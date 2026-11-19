import { describe, expect, it } from 'vitest'
import {
  compilePack,
  loadManifest,
  loadPack,
  listPacks,
  mergeVocabulary,
} from '../src/load-pack.js'
import { validateVocabularySemantics } from '../src/validate-semantics.js'
import type { Vocabulary } from '../src/types/vocabulary.js'
import { wireCrosswalkForCompose } from '../src/wire-crosswalk.js'

describe('@local-hosting/vocab packs', () => {
  it('lists vocab packs', () => {
    expect(listPacks()).toEqual(['city-default', 'resilience'])
  })

  it('city-default has everyday places and geotypes slugs', () => {
    const { vocabulary } = compilePack('city-default')
    expect(vocabulary.places.find((p) => p.id === 'P_home')?.type).toBe(
      'apartment_building',
    )
    expect(vocabulary.resources.some((r) => r.id === 'R_milk')).toBe(true)
    expect(validateEmpty(vocabulary)).toBe(true)
  })

  it('resilience extends city-default', () => {
    const { manifest, vocabulary } = compilePack('resilience')
    expect(manifest.extends).toBe('city-default')
    expect(vocabulary.events.some((e) => e.id === 'E_dinner')).toBe(true)
    expect(vocabulary.events.some((e) => e.id === 'E_flood')).toBe(true)
    expect(vocabulary.resources.find((r) => r.wire_code === 'WBT')?.id).toBe(
      'R_water_bottle',
    )
    expect(validateEmpty(vocabulary)).toBe(true)
  })

  it('loads compiled dist pack after build', () => {
    const vocab = loadPack('city-default')
    expect(vocab.places.length).toBeGreaterThan(0)
  })

  it('wire crosswalk is derived from resilience resources', () => {
    const manifest = loadManifest('resilience')
    expect(manifest.extends).toBe('city-default')
    const vocab = compilePack('resilience').vocabulary
    const wire = wireCrosswalkForCompose(vocab)
    expect(wire.length).toBeGreaterThan(20)
    expect(wire.some((r) => r.legacy_code === 'DBL')).toBe(true)
  })

  it('mergeVocabulary overlays by id', () => {
    const city = compilePack('city-default').vocabulary
    const merged = mergeVocabulary(city, {
      resources: [{ id: 'R_milk', code: 50, labels: { en: 'fresh milk' } }],
    })
    expect(merged.resources.find((r) => r.id === 'R_milk')?.labels.en).toBe(
      'fresh milk',
    )
  })
})

function validateEmpty(vocabulary: Vocabulary): boolean {
  return validateVocabularySemantics(vocabulary).length === 0
}
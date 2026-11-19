#!/usr/bin/env node --import tsx
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertCatalogMatchesPackDirs, catalogPackIds } from '../src/catalog-validate.js'
import { assertCommunityPacksEnSpineOnly } from '../src/community-spine-validate.js'
import { PACK_IDS, compilePack } from '../src/compile-pack.js'
import { validateVocabularySemantics } from '../src/validate-semantics.js'
import { wireCrosswalkForCompose } from '../src/wire-crosswalk.js'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(pkgRoot, rel), 'utf8')) as T
}

const vocabSchema = loadJson('schema/vocabulary.schema.json')

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateVocab = ajv.compile(vocabSchema)

let failed = false

for (const issue of assertCatalogMatchesPackDirs(PACK_IDS)) {
  console.error(issue)
  failed = true
}
for (const issue of assertCommunityPacksEnSpineOnly()) {
  console.error(issue)
  failed = true
}
if (catalogPackIds().length === 0) {
  console.error('catalog/packs.yml missing or empty')
  failed = true
}

function fail(msg: string): void {
  console.error(msg)
  failed = true
}

for (const packId of PACK_IDS) {
  const { manifest, vocabulary } = compilePack(packId)

  if (!validateVocab(vocabulary)) {
    fail(`[${packId}] vocabulary schema: ${ajv.errorsText(validateVocab.errors)}`)
    continue
  }

  if (manifest.vocab_version !== vocabulary.vocab_version) {
    fail(
      `[${packId}] manifest.vocab_version ${manifest.vocab_version} !== vocabulary.vocab_version ${vocabulary.vocab_version}`,
    )
  }

  const issues = validateVocabularySemantics(vocabulary)
  for (const issue of issues) {
    fail(`[${packId}] ${issue.path}: ${issue.message}`)
  }

  if (packId === 'resilience' && manifest.extends !== 'city-default') {
    fail(`[resilience] expected extends city-default`)
  }
  if (packId === 'city-default' && manifest.mode !== 'daily') {
    fail(`[city-default] expected mode daily`)
  }
  if (packId === 'resilience' && manifest.mode !== 'resilience') {
    fail(`[resilience] expected mode resilience`)
  }

  console.log(`ok pack ${packId}`)
}

const resilience = compilePack('resilience').vocabulary
const wire = wireCrosswalkForCompose(resilience)
if (wire.length < 20) {
  fail(`resilience wire crosswalk too small (${wire.length} rows)`)
} else {
  const wbt = wire.find((r) => r.legacy_code === 'WBT')
  if (wbt?.id !== 'R_water_bottle') {
    fail('resilience wire crosswalk missing WBT → R_water_bottle')
  }
  console.log(`ok wire crosswalk (${wire.length} resource tokens)`)
}

if (failed) process.exit(1)
console.log('validate: all packs passed')
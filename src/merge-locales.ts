import fs from 'node:fs'
import path from 'node:path'
import type { SupportedLanguage, Vocabulary } from '@local-hosting/compose'
import { packageRoot } from './paths.js'
import { readYamlFile } from './yaml-io.js'

type LocaleFile = {
  lang: SupportedLanguage
  labels: Record<string, string>
}

function localesDir(): string {
  return path.join(packageRoot(), 'locales')
}

export function loadLocaleFiles(): LocaleFile[] {
  const dir = localesDir()
  if (!fs.existsSync(dir)) return []
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yml') && f !== '_meta.yml')
    .sort()
  const out: LocaleFile[] = []
  for (const file of files) {
    const lang = file.replace(/\.yml$/, '') as SupportedLanguage
    const doc = readYamlFile<{ labels?: Record<string, string> }>(path.join(dir, file))
    if (!doc.labels) continue
    out.push({ lang, labels: doc.labels })
  }
  return out
}

function mergeLabelsRow<T extends { id: string; labels: Record<string, string | undefined> }>(
  row: T,
  localeByLang: LocaleFile[],
): T {
  let labels = { ...row.labels }
  for (const loc of localeByLang) {
    const text = loc.labels[row.id]
    if (text) labels = { ...labels, [loc.lang]: text }
  }
  return { ...row, labels }
}

export function mergeLocalesIntoVocabulary(vocab: Vocabulary): Vocabulary {
  const localeByLang = loadLocaleFiles()
  if (!localeByLang.length) return vocab
  const langs = new Set<SupportedLanguage>(vocab.languages)
  for (const loc of localeByLang) langs.add(loc.lang)
  return {
    ...vocab,
    languages: [...langs].sort(),
    events: vocab.events.map((r) => mergeLabelsRow(r, localeByLang)),
    actions: vocab.actions.map((r) => mergeLabelsRow(r, localeByLang)),
    places: vocab.places.map((r) => mergeLabelsRow(r, localeByLang)),
    resources: vocab.resources.map((r) => mergeLabelsRow(r, localeByLang)),
    actors: vocab.actors.map((r) => mergeLabelsRow(r, localeByLang)),
  }
}
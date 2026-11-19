export type {
  Vocabulary,
  VocabEvent,
  VocabAction,
  VocabPlace,
  VocabResource,
  VocabActor,
  VocabDefaults,
  LabelMap,
  LabeledId,
  SupportedLanguage,
} from '@local-hosting/compose'

export { SUPPORTED_LANGUAGES } from '@local-hosting/compose'

import type { PackMode } from './pack-source.js'

export type PackManifest = {
  id: string
  mode?: PackMode | null
  vocab_version: string
  description: string
  min_compose?: string
  extends?: string | null
}
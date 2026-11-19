import type { PackManifest, Vocabulary } from './types/vocabulary.js'
import { manifestPath, vocabularyPath } from './paths.js'
import { readYamlFile } from './yaml-io.js'

export {
  PACK_IDS,
  compilePack,
  listPacks,
  mergeVocabulary,
  writeCompiledPacks,
  type PackId,
} from './compile-pack.js'

export function loadManifest(packId: import('./compile-pack.js').PackId): PackManifest {
  return readYamlFile<PackManifest>(manifestPath(packId))
}

export function loadPack(packId: import('./compile-pack.js').PackId): Vocabulary {
  return readYamlFile<Vocabulary>(vocabularyPath(packId))
}
/** Source manifest beside vocabulary.yml (authoring YAML). */

export type PackMode = 'daily' | 'resilience'

export type VocabPackSource = {
  pack: {
    id: string
    mode?: PackMode
    version: string
    vocab_version?: string
    description?: string
    min_compose?: string
    extends?: string
  }
  languages: string[]
}
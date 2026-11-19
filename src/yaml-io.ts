import fs from 'node:fs'
import yaml from 'js-yaml'

export function readYamlFile<T>(filePath: string): T {
  const text = fs.readFileSync(filePath, 'utf8')
  return yaml.load(text) as T
}

export function writeYamlFile(filePath: string, data: unknown): void {
  const body = yaml.dump(data, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  })
  fs.writeFileSync(filePath, body)
}
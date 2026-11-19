# `@local-hosting/vocab`

Community **vocabulary packs** (YAML) — **places**, **resources**, **actors**, plus events/actions/defaults.

- **`city-default`** — everyday city scenarios (home, school, errands, transit).
- **`resilience`** — `extends: city-default` + disaster events + compact resource `wire_code` tokens on rows.

Runtime codec (tip, compose, expand) lives in **`@local-hosting/compose`**; map kinds use **`@local-hosting/geotypes`** slugs on `place.type`.

## Layout

```text
catalog/
  packs.yml           # id, mode (daily | resilience), extends, owner
  codebook.yml        # code bands (platform)
packs/
  city-default/       # mode: daily
    pack.yml
    vocabulary.yml
  resilience/         # mode: resilience, extends city-default
    pack.yml
    vocabulary.yml
locales/              # platform translations (merged at compile)
  _meta.yml
  es.yml              # flat labels: { E_dinner: cena, ... }
schema/               # JSON Schema (CI validation only)
dist/packs/<id>/
  vocabulary.yml
  manifest.yml
  inventory.yml       # generated counts + mode
```

Community packs: **English spine only** in `pack.yml` `languages`; platform owns `locales/*.yml`. Pick runtime pack by mode — `loadPack('city-default')` (daily) vs `loadPack('resilience')`.

## Commands

```bash
yarn install
yarn build
yarn validate
yarn test
```

## Consume

```ts
import {
  compilePack,
  loadPack,
  wireCrosswalkForCompose,
} from '@local-hosting/vocab'

const vocab = loadPack('resilience')
const crosswalk = wireCrosswalkForCompose(vocab)
// → mergeCrosswalkIntoTable via @local-hosting/compose
```
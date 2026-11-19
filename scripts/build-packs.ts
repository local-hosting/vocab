#!/usr/bin/env node --import tsx
import { writeCompiledPacks } from '../src/compile-pack.js'

writeCompiledPacks()
console.log('build-packs: wrote dist/packs/*.yml')
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectConfigSourceOwnershipViolations } from './verify-config-source-ownership.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('configuration source ownership gate', () => {
  it('rejects inline endpoints in shipped bundle patches', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-config-source-ownership-'))
    roots.push(root)
    const directory = join(root, 'packages/subagent/subagent-claude-code')
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      join(directory, 'cordis.patch.yml'),
      'config:\n  baseURL: !!js process.env.DEEPSEEK_SEARCH_BASE_URL\n',
    )

    expect(collectConfigSourceOwnershipViolations(root)).toEqual([
      'packages/subagent/subagent-claude-code/cordis.patch.yml:2: inlines a credential or endpoint from the environment.'
      + ' The adapter resolves apiKeyEnv through ctx.credentials and the endpoint through the'
      + ' environment snapshot; inlining here bypasses both ladders.',
    ])
  })
})

it('allows only the North Dev endpoint and parsed header variables', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-config-source-ownership-'))
  roots.push(root)
  const directory = join(root, 'packages/north/dev-bundle')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'cordis.patch.yml'), [
    "baseURL: !!js process.env.NORTH_LLM_BASE_URL || 'http://127.0.0.1:8000/v1'",
    "headers: !!js JSON.parse(process.env.NORTH_LLM2_HEADERS || '{}')",
    "baseURL: !!js process.env.NORTH_LLM3_BASE_URL || 'http://127.0.0.1:8002/v1'",
    "headers: !!js JSON.parse(process.env.NORTH_LLM3_HEADERS || '{}')",
    "baseURL: !!js process.env.NORTH_LLM4_BASE_URL || 'http://127.0.0.1:8003/v1'",
    "headers: !!js JSON.parse(process.env.NORTH_LLM4_HEADERS || '{}')",
    'headers: !!js process.env.OTHER_HEADERS',
    'apiKey: !!js process.env.NORTH_LLM_API_KEY',
    "headers: !!js JSON.parse(process.env.NORTH_LLM_HEADERS || '{}') || process.env.OTHER_HEADERS",
    '',
  ].join('\n'))
  expect(collectConfigSourceOwnershipViolations(root)).toHaveLength(3)
})

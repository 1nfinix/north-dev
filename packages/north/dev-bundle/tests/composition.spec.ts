import { fileURLToPath } from 'node:url'
import { loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'
import { afterEach, expect, it, vi } from 'vitest'
import manifest from '../package.json' with { type: 'json' }
import * as DevBundle from '../src/index.ts'

const patch = manifest.dsh.bundle.patch.flatMap(path =>
  loadOverlayPatches('north-dev-test', fileURLToPath(new URL('../' + path, import.meta.url))))
const rows = new Map(patch.filter(row => row.id !== undefined).map(row => [row.id!, row]))
function evaluate(node: unknown): unknown {
  const { __jsExpr } = node as { __jsExpr: string }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- the Loader evaluates these expressions the same way
  const run = new Function(`return (${__jsExpr})`) as () => unknown
  return run()
}
afterEach(() => vi.unstubAllEnvs())
it('restores development UI and presets', () => {
  expect(DevBundle).toBeDefined()
  for (const id of ['terminal-controller', 'ui-sidebar-terminal', 'ui-plugin-manager',
    'ui-settings-plugins', 'ui-settings-plugin-inventory', 'harness-dev-context', 'preset-ptc', 'preset-minimal']) {
    expect(rows.get(id)?.disabled, id).toBe(false)
  }
  expect(rows.get('better-sidebar')?.config).toEqual({ tabsEnabled: { 'terminal-bottom': true } })
  expect(rows.get('agent-preset-registry')?.config).toEqual({ default: 'standard' })
  expect(patch.flatMap(row => row.insert ?? []).find(row => row.id === 'north-skill-dev')?.name)
    .toBe('@deepseek-ai/dsh-north-skill-dev')
  expect(patch.flatMap(row => row.insert ?? []).find(row => row.id === 'north-dev-session-headers'))
    .toMatchObject({
      name: '@deepseek-ai/dsh-north-dev-bundle',
      config: { headers: ['X-Session-Id', 'x-session-affinity'] },
    })
})
it('restores full access while keeping startup defaults', () => {
  expect(rows.has('sandbox-policy')).toBe(false)
  expect(rows.has('approval')).toBe(false)
  expect(rows.get('permission')?.config).toMatchObject({ presets: {
    'danger-full-access': { sandbox: 'danger-full-access', approval: 'never' },
  } })
})
it('chooses LAN without a DeepSeek key', () => {
  const config = rows.get('agent-default-model')?.config as { provider: unknown; model: unknown }
  vi.stubEnv('DEEPSEEK_API_KEY', undefined)
  vi.stubEnv('NORTH_LLM_MODEL', 'example-model-a')
  expect([evaluate(config.provider), evaluate(config.model)]).toEqual(['north-lan', 'example-model-a'])
  vi.stubEnv('DEEPSEEK_API_KEY', 'test-key')
  expect([evaluate(config.provider), evaluate(config.model)]).toEqual(['deepseek-official', 'deepseek-v4-pro'])
})
it('reads all four model header objects and names the fourth credential', () => {
  const providers = (rows.get('llm-pi-ai')?.config as {
    providers: Record<string, { headers: unknown; apiKeyEnv: string }>
  }).providers
  vi.stubEnv('NORTH_LLM_HEADERS', '{"X-Test":"one"}')
  vi.stubEnv('NORTH_LLM2_HEADERS', '{"X-Test":"two"}')
  vi.stubEnv('NORTH_LLM3_HEADERS', '{"X-Test":"three"}')
  vi.stubEnv('NORTH_LLM4_HEADERS', '{"X-Test":"four"}')
  expect(evaluate(providers['north-lan']!.headers)).toEqual({ 'X-Test': 'one' })
  expect(evaluate(providers['north-lan-2']!.headers)).toEqual({ 'X-Test': 'two' })
  expect(evaluate(providers['north-lan-3']!.headers)).toEqual({ 'X-Test': 'three' })
  expect(providers['north-lan-3']!.apiKeyEnv).toBe('NORTH_LLM3_API_KEY')
  expect(evaluate(providers['north-lan-4']!.headers)).toEqual({ 'X-Test': 'four' })
  expect(providers['north-lan-4']!.apiKeyEnv).toBe('NORTH_LLM4_API_KEY')
})

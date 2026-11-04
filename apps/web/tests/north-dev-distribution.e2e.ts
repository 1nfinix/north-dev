/** North Dev composition exposes development tools, skills, and the standard preset. */
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { SessionId } from '@deepseek-ai/dsh-session'
import { expect, it, onTestFinished } from 'vitest'
import { connectFreshWorkspaceZh } from './support.ts'
import { captureStableAria, compareOrRefreshGolden, launchWebScaffold, watchConsole, webSnapshotMode,
  type WebScaffold } from './scaffold.ts'

const NORTH_BUNDLE = fileURLToPath(new URL('../../../packages/north/bundle', import.meta.url))
const DEV_BUNDLE = fileURLToPath(new URL('../../../packages/north/dev-bundle', import.meta.url))
const GOLDEN = fileURLToPath(new URL('./expected/north-dev-distribution/settings.expected.md', import.meta.url))

it('exposes the terminal, plugin inventory, programming preset and development skills', async () => {
  const resources: { scaffold?: WebScaffold; browser?: Browser } = {}
  const previous = process.env.NORTH_LLM_API_KEY
  process.env.NORTH_LLM_API_KEY = 'north-dev-e2e-placeholder'
  onTestFinished(async () => {
    try {
      await resources.browser?.close()
      await resources.scaffold?.close()
    } finally {
      if (previous === undefined) Reflect.deleteProperty(process.env, 'NORTH_LLM_API_KEY')
      else process.env.NORTH_LLM_API_KEY = previous
    }
  })
  const scaffold = await launchWebScaffold({
    profile: { packages: [{ dir: NORTH_BUNDLE, enabled: true }, { dir: DEV_BUNDLE, enabled: true }], hmr: false },
    extraOverlayPath: fileURLToPath(new URL('./pin-browse-picker.overlay.yml', import.meta.url)),
  })
  resources.scaffold = scaffold
  expect(scaffold.ctx.agentPresets.defaultId).toBe('standard')
  const headers = new Headers()
  scaffold.ctx.waterfall('llm-pi-ai/request-headers', {
    provider: 'north-lan', model: 'example-model-a', baseURL: 'https://example.com/v1',
    sessionId: SessionId('web-example-session'),
  }, headers, () => headers)
  expect(headers.get('X-Session-Id')).toBe('web-example-session')
  expect(headers.get('x-session-affinity')).toBe('web-example-session')
  const browser = await chromium.launch()
  resources.browser = browser
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, locale: 'zh-CN' })
  const errors = watchConsole(page)
  await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
  await connectFreshWorkspaceZh(page, scaffold.workspaceCwd, 'workspace')
  await page.getByRole('button', { name: '打开右侧边栏', exact: true }).click()
  await page.getByText('新建终端', { exact: true }).waitFor()
  await page.getByRole('button', { name: '设置', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '设置' })
  await dialog.getByText('内置插件', { exact: true }).first().click()
  const snapshot = await captureStableAria(page, '[role="dialog"]', scaffold.workspaceCwd)
  await compareOrRefreshGolden(GOLDEN, snapshot, webSnapshotMode())
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'hidden' })
  await page.locator('[data-composer-input][contenteditable="true"]').first().fill('/')
  const options = page.locator('[role="listbox"] [id^="dsh-slash-option-skill-"]')
  await expect.poll(async () => {
    const values = await options.allTextContents()
    return ['code-review', 'git-commit', 'debugging', 'unit-test', 'code-explain', 'sql-review', 'api-doc', 'script-helper']
      .every(name => values.some(value => value.startsWith(name)))
  }).toBe(true)
  expect(errors.pageErrors).toEqual([])
})

# North Dev（诺思开发版）

North Dev 是供开发人员使用的独立 Windows 桌面发行版。它以 north 为办公版基础，只在 north-dev 分支迭代；以后仅从 north 单向合并到 north-dev，不反向合并。仓库不能保存真实网关地址、请求头值、人员标识或网络前缀；真实运行配置来自每台电脑的用户文件或用户环境变量，安装包只包含无真实配置的占位文件。

## 产品隔离

| 项目 | 开发版 |
|---|---|
| 产品名 | North Dev |
| App ID | 构建配置中的 DSH_DESKTOP_APP_ID 加 .dev |
| 安装包 | north-dev- 开头 |
| 数据目录 | 用户主目录下的 .north-dev |
| 工作流 | north-dev-ci.yml、north-dev-windows-desktop.yml |

办公版和开发版可并装，桌面 profile 与设置数据分别位于各自的 DSH_HOME。两者目前保留相同的 dsh 协议；协议唤起的归属由操作系统决定。

## 开发能力

开发版在 North 办公配置包之后应用 dev-bundle。它重新启用终端、插件管理与内置插件页，默认使用上游 standard 编程预设，并保留 office 办公预设供选择。初始沙箱为 workspace-write、审批为 ask；用户可选择 danger-full-access。skill-dev 单独注册八个技能：代码评审、提交信息、排错、单元测试、代码解读、SQL 评审、接口文档与脚本辅助。写作技能和用户技能目录仍由原有包维护。

## 管理员模型设置

管理员把 `apps/desktop/resources/north.env.example` 复制为 `%USERPROFILE%\.north-dev\north.env`，再填写模型变量并重启 North Dev。启动时先读取这个用户文件，再读取安装包内的 `resources/north.env` 占位文件；同名变量按 Windows 用户环境变量、用户文件、安装包文件的顺序取值。用户文件在升级和重装后保留。示例地址只能用于文档：

模型选择器提供 `north-lan`、`north-lan-2`、`north-lan-3` 和 `north-lan-4` 四条内网线路；新增线路不改变新会话的默认模型。

| 变量 | 示例或用途 |
|---|---|
| NORTH_LLM_BASE_URL | http://192.0.2.10:8088/v1 |
| NORTH_LLM_MODEL | example-model-a |
| NORTH_LLM_CONTEXT_WINDOW / NORTH_LLM_MAX_TOKENS | 300000 / 65536 |
| NORTH_LLM2_BASE_URL | http://192.0.2.20:18800/v1 |
| NORTH_LLM2_MODEL | example-model-b |
| NORTH_LLM2_CONTEXT_WINDOW / NORTH_LLM2_MAX_TOKENS | 120000 / 65536 |
| NORTH_LLM3_BASE_URL | http://192.0.2.30:8317/v1 |
| NORTH_LLM3_MODEL | example-model-c |
| NORTH_LLM3_CONTEXT_WINDOW / NORTH_LLM3_MAX_TOKENS | 120000 / 65536 |
| NORTH_LLM4_BASE_URL | http://192.0.2.40:8080/v1 |
| NORTH_LLM4_MODEL | example-model-d |
| NORTH_LLM4_CONTEXT_WINDOW / NORTH_LLM4_MAX_TOKENS | 120000 / 65536 |
| NORTH_LLM_HEADERS / NORTH_LLM2_HEADERS / NORTH_LLM3_HEADERS / NORTH_LLM4_HEADERS | 带 NORTH_ 占位符的 JSON 字符串值对象 |
| NORTH_USER_ID | 每位用户自己的标识 |
| NORTH_MAC_NETWORK | 用于选择本机网卡的 IPv4 地址前缀，示例为 192.0.2. |
| NORTH_MAC_ID | 可手动指定；未设置时从匹配网卡的 MAC 读取 |
| NORTH_LLM_API_KEY / NORTH_LLM2_API_KEY / NORTH_LLM3_API_KEY / NORTH_LLM4_API_KEY | 网关拒绝默认 Authorization 时设置的网关 key |

请求头名仅在 north.env 中按网关要求填写。例如 NORTH_LLM_HEADERS 可写为 {"X-User-Id":"$&#123;NORTH_USER_ID}","X-Mac-Id":"$&#123;NORTH_MAC_ID}"}；第二、三、四条线路分别使用 NORTH_LLM2_HEADERS、NORTH_LLM3_HEADERS、NORTH_LLM4_HEADERS。未设置请求头变量时不发送自定义头；JSON 非法、值非字符串或占位符缺失时桌面启动失败并显示变量名。用户可从 Windows“编辑账户的环境变量”设置 NORTH_USER_ID，或在命令行运行 setx NORTH_USER_ID <工号>，重新登录后生效。

开发版的 dev-bundle 还对每次 pi-ai 模型请求写入 `X-Session-Id` 与 `x-session-affinity`：正常对话和标题生成使用当前 Session id；没有 Session id 的辅助调用为该次调用生成一个 UUID。两个头名由 dev-bundle 配置，不需要写进 north.env。

网关按账号只允许一台设备登录。同一账号在其他设备登录后，本机模型请求会被拒绝并提示检测到新设备登录；在本机重新登录网关配套的客户端后，North Dev 即可继续使用，无需修改配置。

## 打包

在 north-dev 分支安装依赖后，运行 pnpm run package:desktop:win:x64:unsigned。公开仓库的 CI 使用 north-dev-windows-desktop.yml 写入仅含注释的临时 north.env，构建不含真实配置的未签名安装包，并运行安装器、更新与缩放验收。真实模型配置只放在每台电脑的 `%USERPROFILE%\.north-dev\north.env` 或该用户的环境变量中；本机打包若使用真实配置，不公开分发其安装包。

## 安装后验收

1. 与办公版同时安装，分别启动并确认产品名、安装包名和数据目录独立；将示例文件复制为 `%USERPROFILE%\.north-dev\north.env` 并填入本机配置，确认安装包内的 `resources/north.env` 仅含注释。
2. 打开终端与“内置插件”页，确认 standard 为默认预设，office 仍可选择。
3. 检查 danger-full-access 可选，初始会话仍为 workspace-write 与 ask。
4. 分别使用四个 LAN 模型对话；如设置了 DeepSeek key，也检查官方模型。
5. 由网关确认四个模型请求头被接受。网关拒绝 Authorization 时配置对应的 NORTH_LLM_API_KEY、NORTH_LLM2_API_KEY、NORTH_LLM3_API_KEY 或 NORTH_LLM4_API_KEY 后重试。
6. 在新会话输入 /，确认八个开发技能与原有写作技能可见。

## 相对 north 分支的维护文件

以下为本分支首版的逐文件清单。新包资源文件在各自目录内列出。

- `.github/workflows/north-dev-ci.yml`：开发版独立工作流，只在向 north-dev 开 PR 或手动触发时运行，以节省私有仓库的 Actions 免费额度。
- `.github/workflows/north-dev-windows-desktop.yml`：开发版公开构建与仅含注释的打包配置。
- `NORTH-DEV-CHANGELOG.md`：开发版说明与更新记录。
- `NORTH-DEV.md`：开发版说明与更新记录。
- `apps/cli/package.json`：新包与测试接入。
- `apps/desktop/cli/dsh`：桌面命令入口指向开发版可执行文件。
- `apps/desktop/cli/dsh.cmd`：桌面命令入口指向开发版可执行文件。
- `apps/desktop/resources/north.env.example`：管理员四条模型线路的运行时配置示例。
- `apps/desktop/scripts/desktop-build-version-discovery.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/desktop-upload-plan.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/electron-builder-config.mjs`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/installed-update-distribution.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/north-windows-scaling.mjs`：安装后缩放验收的启动占位环境。
- `apps/desktop/scripts/package-macos.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/package-target.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/retain-desktop-ci.ts`：开发版可执行文件或产物命名。
- `apps/desktop/scripts/smoke-packaged-runtime.ts`：开发版可执行文件或产物命名。
- `apps/desktop/src/locale.ts`：桌面身份、环境变量或配置层接入。
- `apps/desktop/src/main.ts`：桌面身份、环境变量或配置层接入。
- `apps/desktop/src/north-env.ts`：用户配置优先于安装包配置，合并后展开四条模型线路的请求头并补默认 key。
- `apps/desktop/src/project-manager.ts`：桌面身份、环境变量或配置层接入。
- `apps/desktop/tests/cli-launcher.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/background-notice.spec.ts`：开发版窗口提示文案回归。
- `apps/desktop/tests/desktop-build-version-discovery.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/desktop-upload-plan.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/desktop-publication-preflight.spec.ts`：开发版安装包名与发布预检回归。
- `apps/desktop/tests/desktop-publication-summary.spec.ts`：开发版发布摘要回归。
- `apps/desktop/tests/expected/about-panel.json`：产品身份与产物名期望。
- `apps/desktop/tests/expected/application-menu-en-US.json`：产品身份与产物名期望。
- `apps/desktop/tests/expected/application-menu-zh-CN.json`：产品身份与产物名期望。
- `apps/desktop/tests/expected/publication-mac-arm64.md`：产品身份与产物名期望。
- `apps/desktop/tests/expected/publication-production.md`：产品身份与产物名期望。
- `apps/desktop/tests/expected/publication-win-x64.md`：产品身份与产物名期望。
- `apps/desktop/tests/expected/test-release-upload-mac-arm64.json`：产品身份与产物名期望。
- `apps/desktop/tests/expected/test-release-upload-mac-x64.json`：产品身份与产物名期望。
- `apps/desktop/tests/expected/test-release-upload-win-x64.json`：产品身份与产物名期望。
- `apps/desktop/tests/fixtures/installed-update-packaging.mjs`：桌面身份、配置或打包回归。
- `apps/desktop/tests/installed-update-distribution.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/installed-update-package-content.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/installed-update-publication.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/installer-packaging.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/macos-signature.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/quit-confirmation.spec.ts`：开发版退出提示回归。
- `apps/desktop/tests/retain-desktop-ci.spec.ts`：开发版产物留存回归。
- `apps/desktop/tests/tray.spec.ts`：开发版托盘文案回归。
- `apps/desktop/tests/main-startup.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/north-env-headers.spec.ts`：第三、四条线路的请求头占位符展开回归。
- `apps/desktop/tests/north-env.spec.ts`：四条线路的默认 key 回归。
- `apps/desktop/tests/package-macos.spec.ts`：桌面身份、配置或打包回归。
- `apps/desktop/tests/windows-update-publisher.spec.ts`：桌面身份、配置或打包回归。
- `apps/web/index.html`：初始网页标题与测试登记。
- `apps/web/tests/expected/north-dev-distribution/settings.expected.md`：开发版浏览器回归期望。
- `apps/web/tests/north-dev-distribution.e2e.ts`：浏览器与 Session 请求头装载回归。
- `apps/web/tests/north-distribution.e2e.ts`：浏览器回归。
- `apps/web/tsconfig.json`：初始网页标题与测试登记。
- `apps/web/vite.config.ts`：初始网页标题与测试登记。
- `package.json`：新包与测试接入。
- `packages/client/locale/src/locales/de.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/en.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/es.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/fr.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/ja.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/pt.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/ru.ts`：本地化窗口标题回退文案。
- `packages/client/locale/src/locales/zh.ts`：本地化窗口标题回退文案。
- `packages/client/ui-sidebar/tests/sidebar-root.client.spec.tsx`：本地化标题回归。
- `packages/client/ui-sidebar/tests/__snapshots__/sidebar-snapshot.client.spec.tsx.snap`：开发版侧栏标题快照。
- `packages/north/dev-bundle/README.i18n.yaml`：开发版配置包双语内容记录。
- `packages/north/dev-bundle/README.md`：开发版配置包与 Session 请求头行为。
- `packages/north/dev-bundle/README.zh.md`：开发版配置包与 Session 请求头行为。
- `packages/north/dev-bundle/cordis.patch.yml`：四条模型线路与 Session 请求头插件装载。
- `packages/north/dev-bundle/locale/de.json`：开发版配置包。
- `packages/north/dev-bundle/locale/en.json`：开发版配置包。
- `packages/north/dev-bundle/locale/es.json`：开发版配置包。
- `packages/north/dev-bundle/locale/fr.json`：开发版配置包。
- `packages/north/dev-bundle/locale/ja.json`：开发版配置包。
- `packages/north/dev-bundle/locale/pt.json`：开发版配置包。
- `packages/north/dev-bundle/locale/ru.json`：开发版配置包。
- `packages/north/dev-bundle/locale/zh.json`：开发版配置包。
- `packages/north/dev-bundle/package.json`：开发版配置包的运行时与测试依赖。
- `packages/north/dev-bundle/src/index.ts`：按请求写入 Session id 的插件。
- `packages/north/dev-bundle/tests/composition.spec.ts`：四条模型线路与插件装载回归。
- `packages/north/dev-bundle/tests/request-headers.spec.ts`：Session 请求头贡献与回退行为回归。
- `packages/north/dev-bundle/tsconfig.json`：开发版配置包的 TypeScript 项目引用。
- `packages/north/skill-dev/README.i18n.yaml`：开发技能包。
- `packages/north/skill-dev/README.md`：开发技能包。
- `packages/north/skill-dev/README.zh.md`：开发技能包。
- `packages/north/skill-dev/assets/api-doc/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/code-explain/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/code-review/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/debugging/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/git-commit/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/script-helper/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/sql-review/SKILL.md`：开发技能包。
- `packages/north/skill-dev/assets/unit-test/SKILL.md`：开发技能包。
- `packages/north/skill-dev/locale/de.json`：开发技能包。
- `packages/north/skill-dev/locale/en.json`：开发技能包。
- `packages/north/skill-dev/locale/es.json`：开发技能包。
- `packages/north/skill-dev/locale/fr.json`：开发技能包。
- `packages/north/skill-dev/locale/ja.json`：开发技能包。
- `packages/north/skill-dev/locale/pt.json`：开发技能包。
- `packages/north/skill-dev/locale/ru.json`：开发技能包。
- `packages/north/skill-dev/locale/zh.json`：开发技能包。
- `packages/north/skill-dev/package.json`：开发技能包。
- `packages/north/skill-dev/src/index.ts`：开发技能包。
- `packages/north/skill-dev/src/shared.ts`：开发技能包。
- `packages/north/skill-dev/tests/skill-dev.spec.ts`：开发技能包。
- `packages/north/skill-dev/tsconfig.json`：开发技能包。
- `pnpm-lock.yaml`：新包与测试接入。
- `scripts/check-workspace-constraints.ts`：新包或开发版 CI 门禁。
- `scripts/client-build-environment.client.spec.ts`：新包或开发版 CI 门禁。
- `scripts/client-build-environment.ts`：新包或开发版 CI 门禁。
- `scripts/north-ci-workflow.spec.ts`：新包或开发版 CI 门禁。
- `scripts/verify-package-readme-model-experience.ts`：新包或开发版 CI 门禁。
- `tsconfig.base.json`：新包与测试接入。
- `tsconfig.host.json`：新包与测试接入。
- `apps/desktop/README.i18n.yaml`：产品身份、本地化或对应文档与回归。
- `apps/desktop/README.md`：产品身份、本地化或对应文档与回归。
- `apps/desktop/README.zh.md`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/extract-report.h`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/de_DE.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/en_US.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/es_ES.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/fr_FR.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/ja_JP.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/pt_BR.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/ru_RU.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/installer/locales/zh_CN.json`：产品身份、本地化或对应文档与回归。
- `apps/desktop/packaging/README.i18n.yaml`：产品身份、本地化或对应文档与回归。
- `apps/desktop/packaging/README.md`：产品身份、本地化或对应文档与回归。
- `apps/desktop/packaging/README.zh.md`：产品身份、本地化或对应文档与回归。
- `docs/config-catalog.md`：新包配置的目录、门禁或对应测试。
- `docs/config-catalog.zh.md`：新包配置的目录、门禁或对应测试。
- `docs/module-graph.md`：新包模块图生成结果。
- `docs/module-graph.zh.md`：新包模块图生成结果。
- `packages/preset/agent-preset/skills/cordis-composition-reference/references/packages.md`：新包配置的目录、门禁或对应测试。
- `scripts/verify-config-source-ownership.spec.ts`：第三、四条线路配置来源白名单回归。
- `scripts/verify-config-source-ownership.ts`：开发版四条线路地址与请求头来源白名单。

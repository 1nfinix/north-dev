# North Dev 诺思开发版

North Dev 是面向开发人员的 AI 桌面助手，基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT）和 North 构建。它可以与 North 办公版并装，使用独立的应用身份和 `~/.north-dev` 数据目录；Windows 上该目录位于 `%USERPROFILE%\.north-dev`。

[下载安装包](https://github.com/1nfinix/north-dev/releases/latest) · [更新记录](../NORTH-DEV-CHANGELOG.md) · [维护说明](../NORTH-DEV.md)

## 能做什么

- 使用终端、侧栏终端、插件管理和「内置插件」页，在工作区内编码、调试与测试。
- 以 `standard` 编程预设和开发助手上下文开始会话；办公助手预设仍可选择。
- 默认在 `workspace-write` 沙箱中操作，审批模式为 `ask`；需要时可以手动选择 `danger-full-access`。
- 使用[八个开发技能](../packages/north/skill-dev/README.zh.md)：代码评审、提交信息、排错、单元测试、代码解读、SQL 评审、接口文档和脚本辅助；同时保留[办公版写作技能](../packages/north/skill-writing/README.zh.md)。在新会话输入 `/` 查找技能。
- 从四条局域网模型线路中选择模型，也可在有网络和 API key 时使用 DeepSeek 官方模型。每条线路可配置按人请求头；各预设为这四条线路按模型输出上限设置压缩余量。

## 安全与隐私

- 安装包只带注释占位配置，不带真实模型地址、人员标识或密钥。把真实配置放在本机用户目录，不要提交到仓库。
- 模型请求发送到配置的网关；选择 DeepSeek 官方模型时，请求发送到其 API。开发版关闭产品遥测。
- `danger-full-access` 是可选权限，不是初始权限。启用前确认当前会话的工作区和操作范围。

## 安装

从 [Releases](https://github.com/1nfinix/north-dev/releases/latest) 下载对应平台和架构的未签名安装包。先设置个人 `NORTH_USER_ID`，并参照 [north.env.example](../apps/desktop/resources/north.env.example) 准备用户配置；配置与会话在升级安装包后留在用户目录。

### Windows

1. 在 Windows「编辑账户的环境变量」中设置 `NORTH_USER_ID`，或运行 `setx NORTH_USER_ID <个人标识>`，然后重新登录以使新环境变量生效。
2. 将配置文件保存为 `%USERPROFILE%\.north-dev\north.env`，再下载 `north-dev-<版本>-win-x64-unsigned.exe`。
3. 双击安装。未签名安装包若触发「Windows 已保护你的电脑」，选择「更多信息」→「仍要运行」。启动 North Dev 后，用配置的模型发送一条测试消息。

### macOS

1. 将配置文件保存为 `~/.north-dev/north.env`，在其中填写 `NORTH_USER_ID=<个人标识>`；Apple Silicon 下载 `arm64` DMG，Intel 下载 `x64` DMG。
2. 打开 DMG，将 `North Dev.app` 拖入「应用程序」。首次打开未签名应用时，可在「系统设置 → 隐私与安全性」选择「仍要打开」，或执行以下命令后再打开：

```sh
xattr -dr com.apple.quarantine "/Applications/North Dev.app"
```

## 配置模型

North Dev 按「已有进程环境变量 → 用户目录中的 `north.env` → 安装包中的注释占位文件」取值。修改用户配置后，完全退出应用再启动。完整变量和 RFC 5737 示例地址见 [north.env.example](../apps/desktop/resources/north.env.example)。

四条局域网线路分别在填写 `NORTH_LLM_BASE_URL`、`NORTH_LLM2_BASE_URL`、`NORTH_LLM3_BASE_URL`、`NORTH_LLM4_BASE_URL` 后显示；未填写地址的线路不出现在模型选择器中。若四条都未配置，新会话默认选择 DeepSeek 官方模型。

| 变量 | 用途 |
|---|---|
| `NORTH_LLM_BASE_URL`、`NORTH_LLM2_BASE_URL`、`NORTH_LLM3_BASE_URL`、`NORTH_LLM4_BASE_URL` | 四条线路的 OpenAI 兼容网关地址；示例：`http://192.0.2.10:8088/v1` |
| `NORTH_LLM_MODEL`、`NORTH_LLM2_MODEL`、`NORTH_LLM3_MODEL`、`NORTH_LLM4_MODEL` | 各线路的模型 id；示例：`example-model-a` |
| `NORTH_LLM{,2,3,4}_DISPLAY_NAME`、`NORTH_LLM{,2,3,4}_CONTEXT_WINDOW`、`NORTH_LLM{,2,3,4}_MAX_TOKENS` | 显示名称、上下文窗口和输出上限；压缩余量跟随对应输出上限 |
| `NORTH_LLM{,2,3,4}_API_KEY` | 网关要求 key 时分别填写 |
| `NORTH_LLM{,2,3,4}_HEADERS` | 各线路自定义请求头的 JSON 对象；值可引用 `${NORTH_USER_ID}`、`${NORTH_MAC_ID}` |
| `NORTH_USER_ID`、`NORTH_MAC_ID`、`NORTH_MAC_NETWORK` | 个人标识；可手动设置 MAC，或用 IPv4 前缀选择网卡自动读取；前缀示例：`192.0.2.` |
| `DEEPSEEK_API_KEY` | 能访问互联网并选择 DeepSeek 官方模型时使用；也可在「设置 → 模型」中填写 |

请求头占位符引用的变量缺失、为空或 JSON 无效时，桌面应用会在启动时报告错误。`X-Session-Id` 与 `x-session-affinity` 由开发版配置包按会话添加，无需写入 `north.env`。

## 从源码构建

需要 Node.js 24.9 或更新版本和 pnpm。打包前让 `NORTH_ENV_PATH` 指向只含注释的本地占位文件；Windows 未签名打包还需按[工作流](workflows/north-dev-windows-desktop.yml)设置应用 ID。依赖安装与构建命令：

```sh
pnpm install --frozen-lockfile
pnpm run build:artifacts
pnpm run package:desktop:mac:arm64:unsigned
```

Intel Mac 将最后一行改为 `pnpm run package:desktop:mac:x64:unsigned`；Windows 改为 `pnpm run package:desktop:win:x64:unsigned`。公开库的 [Windows](workflows/north-dev-windows-desktop.yml) 和 [macOS](workflows/north-dev-macos-desktop.yml) 工作流会准备占位配置并构建未签名安装包。

## 许可

North Dev 沿用上游 DeepSeek Harness 的 [MIT 许可](../LICENSE)。第三方依赖许可见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

# 小小打卡项目架构

## 1. 项目定位

小小打卡是一个本地优先的习惯打卡应用。用户可以创建多个项目，例如健身、背单词和普拉提；每个项目拥有独立颜色、涂鸦图案和按月展示的打卡记录。

项目使用 Expo SDK 57、React Native 0.86 和 TypeScript，共用一套业务代码，同时输出 iOS、Android 和 Web/PWA 版本。

## 2. 目录结构

```text
daka-app/
├── App.tsx                    # 应用状态、页面切换、项目增删改、本地持久化
├── index.ts                   # Expo 入口，同时注册 Web Service Worker
├── app.json                   # Expo、原生包名和 Web/PWA 配置
├── package.json               # 依赖和开发、构建、部署命令
├── assets/                    # 原生 App、PWA 和启动页图片
├── src/
│   ├── screens/               # 打卡月历页、项目管理页
│   ├── components/            # 涂鸦画板、项目编辑弹窗
│   ├── utils/date.ts          # 月历、日期、连续打卡和统计逻辑
│   ├── doodles.ts             # 旧图标迁移和默认涂鸦图案
│   ├── types.ts               # 项目、涂鸦和打卡数据类型
│   ├── theme.ts               # 紫粉色主题色
│   └── registerServiceWorker.ts # PWA 离线缓存注册
├── scripts/build-pwa.mjs      # Web 导出后生成 Manifest、图标、字体和 Service Worker
├── ARCHITECTURE.md            # 本架构说明
└── README.md                  # 开发、构建和发布说明
```

## 3. 数据流和存储

应用启动时从 `@daka/state/v1` 读取本地状态，状态结构定义在 `src/types.ts` 的 `PersistedState`：

```text
PersistedState
├── projects[]                  # 项目名称、颜色、涂鸦、创建时间
├── checkIns[projectId][date]  # 某项目某日期是否完成
└── selectedProjectId           # 当前选中的项目
```

原生版本使用 AsyncStorage；Web/PWA 版本由 AsyncStorage Web 适配器保存到当前浏览器的本地存储。当前没有账号、云数据库或跨设备同步，因此不同手机和不同浏览器的数据彼此独立。

## 4. 页面职责

- `CheckInScreen`：项目横向选择、月历切换、历史补签、今天打卡和月度统计。
- `ProjectsScreen`：项目列表、累计统计、编辑、删除和新建入口。
- `ProjectEditorModal`：项目名称、颜色和用户涂鸦的创建/编辑。
- `DoodleCanvas`：使用 React Native PanResponder 采集归一化笔画，并以 SVG 路径保存和渲染。

## 5. PWA 离线机制

`npm run build:web` 先执行 Expo Web 单页导出，再由 `scripts/build-pwa.mjs`：

1. 生成 `manifest.webmanifest` 和 iPhone/Android 图标。
2. 注入 Safari 主屏幕元信息和移动端视口配置。
3. 将 Expo 图标字体移动到 `/fonts`，避免 Cloudflare Pages 忽略 `node_modules` 路径。
4. 生成带内容版本号的 `sw.js`，预缓存 HTML、JavaScript、字体和图标。

首次在线打开并完成缓存后，Service Worker 会在无网络时返回缓存页面；打卡数据仍保存于设备本地。

## 6. 原生版本和发布

- iOS 包名：`com.local.tinycheckin`
- Android 包名：`com.local.tinycheckin`
- iOS 原生工程由 Expo 生成，个人免费 Apple ID 签名通常约 7 天有效。
- PWA 正式地址：<https://tiny-checkin.pages.dev/>
- Cloudflare Pages 项目名：`tiny-checkin`

## 7. 常用命令

```bash
npm install
npm run web          # Web 开发预览
npm run build:web   # 生成 dist/ PWA 产物
npm run deploy:web  # 构建并部署到 Cloudflare Pages
npx tsc --noEmit    # TypeScript 检查
```

## 8. 不提交到 GitHub 的本机生成内容

`.gitignore` 排除了 `node_modules/`、`.expo/`、`dist/`、`ios/`、`android/` 和本机临时配置。这些内容可以根据源码重新生成；尤其是 Xcode Pods、签名缓存和 Wrangler 凭据不应进入仓库。

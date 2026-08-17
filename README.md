# 小小打卡

一个本地优先的月历打卡 App，使用 Expo + React Native + TypeScript 开发。

项目架构和数据存储说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 已实现

- 创建、编辑和删除多个打卡项目
- 为每个项目绘制并保存专属涂鸦图案
- 按月查看打卡记录，可补签历史日期
- 本月完成天数、连续打卡和完成率统计
- 手机本地离线保存
- Android、iOS 和 Web 同一套代码

## 本地预览

```bash
npm install
npm start
```

手机安装 Expo Go 后，扫描终端二维码即可预览。电脑浏览器预览使用：

```bash
npm run web
```

## 生成离线 PWA

```bash
npm run build:web
```

构建产物位于 `dist/`，其中包含 Web App Manifest、iPhone 主屏幕图标和离线缓存。
将整个 `dist/` 目录部署到支持 HTTPS 的静态网站服务后，在 iPhone Safari 中打开网址，
点击“分享” → “添加到主屏幕”即可安装。首次在线打开完成缓存后，断网也能继续使用。

本地检查生产版本：

```bash
npm run preview:web
```

当前 Cloudflare Pages 正式地址：

https://tiny-checkin.pages.dev/

后续修改完成后，重新构建并发布：

```bash
npm run deploy:web
```

## 生成安装包

首次构建需要登录一个 Expo 账号：

```bash
npx eas-cli login
```

生成可直接安装的 Android APK：

```bash
npm run build:android
```

生成 iOS 安装包需要 Apple Developer 账号：

```bash
npm run build:ios
```

构建完成后，EAS 会返回安装包下载链接。

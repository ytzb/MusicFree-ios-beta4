# 代码出处与二次开发声明

## 一、代码出处

本仓库（`tsukiyo-zero/MusicFree-ios-ipa`）**不是原创项目**，是下列开源项目的二次开发产物。
按照 AGPL-3.0 的要求，此处明确保留原始出处：

| 层级 | 项目 | 地址 |
|---|---|---|
| **原始项目（上游）** | **MusicFree** —— 作者 [maotoumao](https://github.com/maotoumao) | <https://github.com/maotoumao/MusicFree> |
| iOS 适配 | MusicFree-ios | <https://github.com/zhuguibiao/MusicFree-ios> |
| iOS 适配（延续） | MusicFree-ios | <https://github.com/TralyFang/MusicFree-ios> |
| **本仓库（二次开发）** | MusicFree-ios-ipa | <https://github.com/tsukiyo-zero/MusicFree-ios-ipa> |

> 原始项目地址：**<https://github.com/maotoumao/MusicFree>**
> 本仓库所有代码的知识产权归原作者 maotoumao 及上游贡献者所有。

## 二、开源协议

本项目沿用上游协议：**GNU Affero General Public License v3.0（AGPL-3.0）**，
完整协议文本见仓库根目录 [`LICENSE`](./LICENSE)。

依 AGPL-3.0：

- 分发本软件及其修改版时，必须保留本声明与 `LICENSE` 文件；
- 必须提供完整的对应源代码；
- 不得移除或修改原作者版权信息。

## 三、本仓库相对上游的改动

仅列改动点，便于与上游 diff 对照：

### 1. 修复 iOS 27 SDK 下启动闪退（系统级阻断）

- **现象**：用 Xcode 27（iOS 27 SDK）构建出的包，在 iOS 27 设备上启动即崩溃，
  堆栈为 `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`（`EXC_BREAKPOINT`）。
- **原因**：iOS 27 SDK 强制要求 App 采用 `UIScene` 生命周期，上游模板仍在
  `AppDelegate` 的 `didFinishLaunchingWithOptions` 中直接创建 `UIWindow`。
- **改动**：
  - 新增 `ios/MusicFree/SceneDelegate.h` / `SceneDelegate.mm`，接管 `RCTAppDelegate`
    已创建的 window 并挂到新的 `UIWindowScene`，同时转发深链；
  - `ios/MusicFree/Info.plist` 增加 `UIApplicationSceneManifest`；
  - `ios/MusicFree.xcodeproj` 将 `SceneDelegate.mm` 加入编译。

### 2. 修复 iOS 下载目录选择交互

- `src/pages/fileSelector/index.tsx`：选目录模式下点击整行即为「选中」，
  新增「进入下一级」箭头按钮；底部新增「新建文件夹」「用当前目录」；
  未选中点击确定时给出明确提示；修复加载态可能卡死的问题。
- `src/pages/fileSelector/fileItem.tsx`：新增 `showEnter` / `onEnterPress`，放大点击热区。

### 3. 新增「导出到「文件」App」

- `src/utils/exportFile.ts`（新增）：
  - `exportToFilesApp()` 调起系统「存储到文件」面板，支持单文件与批量；
  - `openFilesApp()` 打开系统「文件」App；
  - `shortPath()` / `describePath()` 将沙盒 UUID 路径翻译为
    `我的 iPhone → MusicFree → download → music` 这类可读形式。
- `src/components/panels/types/musicItemOptions.tsx`：已下载歌曲新增「导出到「文件」App」「下载管理」。
- `src/entry/bootstrap/bootstrap.ts`：下载队列完成后弹窗，直接提供批量导出入口。

### 4. 新增「下载管理」页

- `src/pages/downloadManager/index.tsx`（新增）：列出下载目录内的音频文件，
  显示大小与修改时间，支持单文件导出 / 删除，顶部菜单支持刷新、全部导出、打开文件 App。
- `src/core/router/index.ts`、`src/core/router/routes.tsx`：注册 `download-manager` 路由。

### 5. 下载流程的可观测性

- `src/core/downloader.ts`：记录本批成功落盘的文件路径并随事件抛出；
  目录不可写时给出明确提示（原为静默失败）；下载成功 / 失败均有 Toast。

### 6. 设置页重构

- `src/pages/setting/settingTypes/basicSetting.tsx`：
  下载路径改为显示相对路径 + 可读位置；移除冗余入口；
  新增「下载管理」「在「文件」中打开下载目录」。

### 7. 构建配置

- `ios/Podfile`：`post_install` 中将所有 Pod target 的
  `IPHONEOS_DEPLOYMENT_TARGET` 统一提升至 `15.1`
  （Xcode 26/27 拒绝低于 15.0 的部署目标，否则 `pod install` 后直接编译失败）。

## 四、使用范围声明

- 本项目仅用于**个人学习与技术研究**，不用于任何商业用途；
- 项目本身**不提供任何音源内容**，播放能力全部依赖用户自行安装的第三方插件；
- 请遵守你所在地区的法律法规，以及各音乐服务平台的服务条款。

## 五、致谢

感谢 [maotoumao](https://github.com/maotoumao) 开发并开源 MusicFree，
以及 [zhuguibiao](https://github.com/zhuguibiao)、[TralyFang](https://github.com/TralyFang)
在 iOS 适配上的工作。

## 六、本仓库（zdh2021）在上述基础上的改动

- 基于 `tsukiyo-zero/MusicFree-ios-ipa`（2026-11-11）的 iOS 适配代码；
- 合入上游 `maotoumao/MusicFree` 标签 `v1.0.0-beta.4`（commit d118b18）相对 `v0.6.2` 的全部公开源码改动
  （`src/core/backup.ts`、`src/core/pluginManager/index.ts`、`src/utils/log.ts`）；
- 去掉原 Bundle ID / 开发团队，新增 `.github/workflows/ios-unsigned.yml` + `scripts/ci-build-ios.sh`，
  用 GitHub Actions macOS runner 编译**未签名** ipa，供用户自行签名侧载；
- 注意：官方 v1.0.0-beta.4 安卓 APK 中的部分新功能（WebDAV 改进等）未出现在上游公开仓库中，因此本仓库无法包含。

许可证仍为 AGPL-3.0，原作者 maotoumao。

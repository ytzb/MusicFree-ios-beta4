> ## ⚠️ 代码出处与协议声明（必读）
>
> 本仓库是 **二次开发** 项目，**非原创**。原始项目为
> **[maotoumao/MusicFree](https://github.com/maotoumao/MusicFree)**，
> 遵循 **AGPL-3.0** 协议发布，本仓库完整保留原始出处与协议。
>
> | 层级 | 项目 |
> |---|---|
> | 原始项目 | [maotoumao/MusicFree](https://github.com/maotoumao/MusicFree) |
> | iOS 适配 | [zhuguibiao/MusicFree-ios](https://github.com/zhuguibiao/MusicFree-ios) · [TralyFang/MusicFree-ios](https://github.com/TralyFang/MusicFree-ios) |
> | 本仓库 | [tsukiyo-zero/MusicFree-ios-ipa](https://github.com/tsukiyo-zero/MusicFree-ios-ipa) |
>
> - 协议：[AGPL-3.0](./LICENSE)，分发时请保留本声明与 LICENSE 文件
> - 本仓库相对上游的**具体改动清单**见 [NOTICE.md](./NOTICE.md)
> - 仅用于个人学习与技术研究，请勿用于商业用途
> - 本项目不提供任何音源内容，播放能力依赖用户自行安装的第三方插件

# MusicFree-ios

**中文** | [English](./readme-en.md)

[![Download](https://img.shields.io/github/downloads/zhuguibiao/MusicFree-ios/total)](https://github.com/zhuguibiao/MusicFree-ios/releases)
![GitHub package.json version](https://img.shields.io/github/package-json/v/zhuguibiao/MusicFree-ios)

**更多信息请参考原项目 <https://github.com/maotoumao/MusicFree#readme>**
> 基于MusiceFree修改的ios版本，提供可用的ipa包

## ipa下载地址
[ipa下载地址](https://github.com/zhuguibiao/MusicFree-ios/releases)

## ipa安装
  1. AltStore (推荐)
     - [AltStore官网](https://faq.altstore.io/)
     - [文字说明](https://telegra.ph/AltStore-%E4%B8%8B%E8%BC%89%E6%95%99%E5%AD%B8-03-02)
  2. Sideloadly
     - [Sideloadly官网](https://sideloadly.io/)
     - [文字说明](https://telegra.ph/AltStore-%E4%B8%8B%E8%BC%89%E6%95%99%E5%AD%B8-03-02)
  3. ......

## 插件
- [ios B站插件](https://raw.githubusercontent.com/zhuguibiao/m-plugins/refs/heads/main/bilibili.js): 修复了原b站插件ios使用问题

## 开发

### 工具版本
- 代码版本: [v0.6.1](https://github.com/maotoumao/MusicFree/releases/tag/v0.6.1)
- react-native: [0.76.5](https://reactnative-archive-august-2025.netlify.app/docs/0.76/set-up-your-environment)
- yarn: 1.22.22
- cocoapods: 1.16.2 // brew install cocoapods
- node: 20.19.4
- xcode: 16.4 

### 生成ipa

#### 1. 环境准备

搭建好 [react-native ios](https://reactnative-archive-august-2025.netlify.app/docs/0.76/set-up-your-environment) 开发环境，确保以下工具已安装：

| 工具 | 版本 |
|------|------|
| Node | 20.19.4 |
| Yarn | 1.22.22 |
| CocoaPods | 1.16.2 (`brew install cocoapods`) |
| Xcode | 16.4 |

#### 2. 安装依赖

```bash
# 安装 npm 依赖
yarn install

# 安装 iOS 原生依赖
cd ios && pod install && cd ..
```

#### 3. Xcode 配置

1. 用 Xcode 打开 `ios/MusicFree.xcworkspace`（注意是 `.xcworkspace` 不是 `.xcodeproj`）
2. 选择 Target `MusicFree` → **Signing & Capabilities** 选项卡：
   - 配置个人开发者证书（Team）
   - 修改 Bundle Identifier 为你自己的（如 `com.yourname.musicfree`）
3. 在 Capabilities 中添加 **"Audio, Airplay, and Picture in Picture"**（后台播放）

#### 4. 切换为 Release 构建

1. Xcode 顶部菜单：**Product → Scheme → Edit Scheme...**
2. 左侧选择 **Run**，将 **Build Configuration** 从 `Debug` 改为 `Release`

#### 5. 编译

1. 在 Xcode 顶部选择目标设备（选择你的 iPhone 或 "Any iOS Device"）
2. 点击 **Product → Build**（或按 `⌘B`）等待编译完成

#### 6. 生成 IPA 文件

编译成功后，手动打包 IPA：

```bash
# 进入 DerivedData 找到 .app 文件
cd ~/Library/Developer/Xcode/DerivedData/
# 找到 MusicFree 开头的目录，进入 Build/Products/Release-iphoneos/

# 创建 Payload 目录并复制 .app
mkdir -p /tmp/Payload
cp -r MusicFree-xxx/Build/Products/Release-iphoneos/MusicFree.app /tmp/Payload/

# 压缩并重命名为 .ipa
cd /tmp
zip -r MusicFree.ipa Payload/
```

最终得到的 `MusicFree.ipa` 即为安装包 🚀

#### 注意事项

- 免费开发者账号签名的 IPA 有效期为 7 天，到期需重新签名
- 没有付费开发者账号时，不能使用 Archive 方式导出，只能用上述 DerivedData 手动打包方式
- 安装后需在 iPhone「设置 → 通用 → VPN与设备管理」中信任你的开发者证书


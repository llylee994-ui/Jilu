# 迹录 Mobile — 开发构建模式

本项目使用 Expo 开发构建（dev client），不使用 Expo Go。

## 环境要求
- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

## 首次运行
```bash
cd mobile
npm install
npx expo prebuild    # 生成 android/ 和 ios/ 目录
npx expo run:android # 构建并安装到设备/模拟器
```

## 日常开发
```bash
npx expo start --dev-client  # 启动 dev server
# 然后在 Android Studio 中打开 android/ 目录运行
# 或在已安装 dev client 的设备上直接打开 app
```

## 为什么不用 Expo Go
Expo Go 是沙盒环境，不支持：
- 悬浮窗权限 (SYSTEM_ALERT_WINDOW)
- 后台剪贴板监听 (Foreground Service)
- 本地 C++ 推理引擎 (llama.cpp)

开发构建模式编译完整的原生 APK，无以上限制。

## docs
https://docs.expo.dev/versions/latest/

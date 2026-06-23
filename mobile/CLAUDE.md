# 迹录 Mobile

本项目使用 Expo 开发构建（dev client），不是 Expo Go。在生成任何代码前，请查阅 @AGENTS.md 了解构建流程。

关键约束：
- 所有数据库操作使用 expo-sqlite（异步 API）
- 不使用 uuid 包，使用本地 generateUUID()
- 绝对禁止任何网络请求代码
- 仅支持 Android/iOS 移动端，不生成 Web 独占代码

---
name: 迹录 (Jilu)
description: 有记忆的私人职场 Agent — 克制、温暖、可靠的移动端设计系统
colors:
  quiet-blue: "#5E7CE6"
  quiet-blue-soft: "rgba(94,124,230,0.6)"
  morning-light: "#F8F6F3"
  plain-white: "#FFFFFF"
  ink: "#1A1A1A"
  stone: "#8E8E93"
  mist: "#E5E5EA"
  midnight: "#1C1C1E"
  midnight-card: "#2C2C2E"
  night-ink: "#E5E5EA"
  night-blue: "#7B93F7"
  night-blue-soft: "rgba(123,147,247,0.6)"
  night-mist: "#2C2C2E"
  green: "#34C759"
  night-green: "#30D158"
  red: "#FF3B30"
  night-red: "#FF453A"
  amber: "#FF9500"
  night-amber: "#FF9F0A"
typography:
  body:
    fontFamily: "System, SF Pro, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "System, SF Pro, Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  label:
    fontFamily: "System, SF Pro, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  caption:
    fontFamily: "System, SF Pro, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  chip: "20px"
  card: "12px"
  input: "10px"
  button: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  chip-default:
    backgroundColor: "{colors.plain-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    height: "32px"
    padding: "6px 14px"
  chip-selected:
    backgroundColor: "{colors.quiet-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.chip}"
  button-primary:
    backgroundColor: "{colors.quiet-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "14px 24px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.red}"
    padding: "16px 0"
  card-memory:
    backgroundColor: "{colors.plain-white}"
    rounded: "{rounded.card}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.plain-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "12px"
  tab-bar:
    backgroundColor: "{colors.plain-white}"
    height: "56px"
  message-bubble-agent:
    backgroundColor: "{colors.plain-white}"
    rounded: "16px"
    padding: "10px 14px"
  message-bubble-user:
    backgroundColor: "{colors.quiet-blue}"
    textColor: "#FFFFFF"
    rounded: "16px"
    padding: "10px 14px"
---

# Design System: 迹录 (Jilu)

## 1. Overview

**Creative North Star: "成长的盆栽"**

迹录的视觉系统围绕一个隐喻构建：一盆放在书桌上的小植物。它不是花园，不是森林——它是**个人的、私密的、正在生长的**。界面像花盆一样安静地存在，不为引人注目，只为承载正在生长的东西。记忆积累时，植物从幼苗慢慢舒展——这个视觉承诺现在还只是在 PRODUCT.md 里的一句话，但色盘、间距、组件的"呼吸感"已经为它预留了空间。

这是一个**轻量级移动端设计系统**。亮暗双模、系统字体、单色强调。它不追求视觉冲击——它追求的是"用过一周后，你不会觉得界面存在"。克制不是冷淡，是尊重用户的注意力；温暖不是装饰，是让人感到安全。

**Key Characteristics:**
- 单一蓝色强调（≤10% 屏幕面积），其余全部中性色
- 亮暗双模同等权重，不是"默认亮色 + 附送暗色"
- 圆角像鹅卵石，不是几何正圆——12px 卡片，20px 按钮
- 分割线是最轻的存在：`hairlineWidth` + `#E5E5EA`，几乎看不见
- 系统字体（SF Pro / Roboto），没有自定义字体加载

## 2. Colors

色盘围绕一颗安静的蓝色构建。"静蓝"是唯一的强调色，用于当前选中状态、主操作按钮、悬浮球呼吸灯。其余全部是中性色——从晨光般的暖白到深夜的墨黑。语义色（绿/红/琥珀）仅用于状态传达，不作为装饰。

### Primary
- **静蓝 Quiet Blue** (#5E7CE6): 主操作按钮、Tab 选中态、分类 Chip 选中态、悬浮球呼吸灯。亮暗双模各一个变体，暗模下略亮以保持对比度。
- **柔蓝 Quiet Blue Soft** (rgba(94,124,230,0.6)): 选中态的柔和背景——比如"记一下"按钮的 ON 态底色、分类筛选的淡化背景。

### Neutral — Light
- **晨光 Morning Light** (#F8F6F3): 亮模页面底色。不是纯白——带一点几乎察觉不到的暖意，像早晨书桌上的自然光。这是系统里唯一带色温的表面。
- **素白 Plain White** (#FFFFFF): 卡片背景。比页面底色更亮，形成轻微的抬升感（无阴影）。
- **墨色 Ink** (#1A1A1A): 主文字。接近纯黑但不是纯黑——纯黑在屏幕上太刺眼。
- **石灰色 Stone** (#8E8E93): 辅助文字、占位符、时间戳、非活跃图标。
- **薄雾 Mist** (#E5E5EA): 分割线、输入框边框。极浅，几乎不存在，但刚好能区分区域。

### Neutral — Dark
- **午夜 Midnight** (#1C1C1E): 暗模页面底色。
- **午夜卡片 Midnight Card** (#2C2C2E): 暗模卡片背景，比页面底色亮半级。
- **夜墨 Night Ink** (#E5E5EA): 暗模主文字。
- **夜蓝 Night Blue** (#7B93F7): 暗模强调色，比亮模的静蓝略亮，在暗底上保持相同的"存在感"。
- **夜雾 Night Mist** (#2C2C2E): 暗模分割线。
- **夜绿/夜红/夜琥珀**: 暗模语义色，略亮于亮模对应色。

### Semantic
- **绿 Green** (#34C759): 成功状态——"保留入库"按钮、记忆存入确认卡片。
- **红 Red** (#FF3B30): 危险操作——"移入回收站"按钮、删除确认。
- **琥珀 Amber** (#FF9500): 警告/待定——中分待定项的视觉暗示。

### Named Rules
**The One Accent Rule.** 静蓝覆盖不超过任何一张屏幕 10% 的面积。它的稀有就是它的力量。如果一眼看过去有三个以上的蓝色元素，说明太多了。

**The Hairline Rule.** 所有分割线使用 `StyleSheet.hairlineWidth`（0.5px 物理像素）+ 薄雾色。分割线的存在感应该是一个"轻微的呼吸停顿"，不是一个"障碍物"。

## 3. Typography

**Font:** 系统字体栈（SF Pro on iOS, Roboto on Android）。单一家族，多重字重。不要自定义字体——移动端加载自定义字体会增加包体积和首屏延迟，而系统字体在各自平台上已经是最优阅读体验。

**Character:** 安静、高效、不带装饰性。标题用 700 字重建立层次，正文用 400 保持透气。没有全大写标签，没有 tracked-out 小字眉毛。

### Hierarchy
- **Title** (700, 20px, 1.3): 页面标题栏——每个 Tab 顶部的页面名称。一个字，不加装饰。
- **Body** (400, 15px, 1.5): 记忆内容、聊天消息。行长不超过屏幕宽度 80%（约 40-50 个中文字符），超过折叠。
- **Label** (600, 13px, 1.3): 分类 Chip、Tab 标签、表单字段名。需要比正文更紧凑但不失可读性。
- **Caption** (400, 11px, 1.4): 时间戳、AI 角标、辅助元数据。屏幕上的最小信息单元。

### Named Rules
**The No-Font Rule.** 禁止引入任何自定义字体文件。系统字体就是最优解——在 iOS 和 Android 上各自经过数百万小时的阅读验证。

## 4. Elevation

**扁平的，通过色调分层而不是阴影来区分层级。**

这个系统不使用 `box-shadow`。页面的层次感来自于：页面底色（晨光）vs 卡片背景（素白）vs 输入框背景（素白 + 1px 薄雾描边）。Tab 栏和页面内容之间用一道 `hairlineWidth` 分割线。暗模同理：午夜底色 vs 午夜卡片。

没有悬浮感、没有投影、没有"浮起来"的卡片。一切元素都在同一个平面上——只是通过明度差异告诉你"这片区域是供你操作的，那片区域是供你阅读的"。

### Named Rules
**The Flat-By-Default Rule.** 不使用 `box-shadow`、`elevation`、或任何投影。如果需要一个区域从背景中分离出来，用 1-2 级明度差（亮模：`#F8F6F3` → `#FFFFFF`；暗模：`#1C1C1E` → `#2C2C2E`）。

## 5. Components

### Buttons
- **Shape:** 胶囊形（20px 圆角）。按钮不应该有尖锐的角——它们邀请点击，不是声明边界。
- **Primary:** 静蓝背景 + 白色文字，`padding: 14px 24px`。用于页面唯一的主操作（"一键智能整理"、"创建"、"保存"）。
- **Danger:** 透明背景 + 红色文字，`padding: 16px 0`，居中。永远不在红色按钮上加红色背景——红色文字本身就足够警告。
- **Hover / Active:** 没有 hover（移动端）。Active 态：opacity 降至 0.7。
- **Disabled:** 背景变为薄雾色，文字变为石灰色。

### Chips
- **Style:** 圆角胶囊（20px，高 32px），1px 薄雾描边，素白背景，Label 字重（600, 13px）。
- **Selected:** 静蓝背景，描边消失，白色文字。
- **Layout:** 水平滚动，间距 8px，左右 16px padding。整行高度不超过 52px（含上下 padding）。
- **Variant:** 只有一个变体——分类筛选 Chip。没有 outline/ghost/filled 变体矩阵。

### Cards
- **Memory Card:** 12px 圆角，素白背景，16px 内边距，8px 下边距。没有描边，没有阴影。卡片之间靠间距区分。
- **Internal layout:** 标题（Label 字重 + 正文大小 16px），摘要（Body, 14px, 石灰色），底部元数据行（Caption, 11px, 分类圆点 + AI 角标 + 相对时间）。

### Inputs
- **Style:** 10px 圆角，1px 薄雾描边，素白背景，12px 内边距，Body 字号（15px）。
- **Focus:** 没有 focus ring（移动端无此概念）。光标即反馈。
- **Multiline:** `minHeight: 120px`，`textAlignVertical: top`。
- **Placeholder:** 石灰色，与辅助文字同色——占位符的对比度应该和辅助文字一样，不应该更淡。

### Navigation
- **Tab Bar:** 56px 高，素白背景，顶部 hairlineWidth 薄雾分割线。5 个 Tab 等宽，图标在上（24x24）+ 文字在下（Caption, 11px, 600 字重）。
- **Active:** 静蓝，图标和文字同色。
- **Inactive:** 石灰色，opacity 降至未选中态。
- **Stack Header:** 页面标题栏：Title 字重（700, 20px），左箭头返回键。背景 = 页面底色（晨光），底部 hairlineWidth 分割线。

### Chat Bubbles
- **Agent Bubble:** 左对齐，16px 圆角，素白背景，`max-width: 82%`。顶部有 10px 的 "Agent" 标签。
- **User Bubble:** 右对齐，16px 圆角，静蓝背景，白色文字。
- **Memory Saved Bubble:** 左对齐，16px 圆角，10% 绿色透明背景 + 40% 绿色 1px 描边——区别于普通消息。
- **Timestamp:** Caption 字号（11px），石灰色，气泡下方。
- **"记一下" Toggle:** 输入框上方，圆角 16px 的 Chip 风格按钮。OFF：素白背景 + 石灰色文字。ON：10% 绿色透明背景 + 绿色文字 + "ON" 角标。

## 6. Do's and Don'ts

### Do:
- **Do** 使用 `hairlineWidth` 作为所有分割线宽度——不要用 `1px`。
- **Do** 保持静蓝在每屏 ≤10% 面积——它是一颗种子，不是一片森林。
- **Do** 用明度差（两层中性色）而不是阴影来区分层级。
- **Do** 使用系统字体，永远不要加载自定义字体。
- **Do** 暗模和亮模同等重要——每个组件都要在两种模式下测试。
- **Do** 使用相对时间（"3 分钟前"、"昨天"）而不是绝对时间戳，除非在详情页。

### Don't:
- **Don't** 引入任何投影、渐变、或玻璃拟态效果——这是迹录，不是企业 OA。
- **Don't** 使用 `border-left` 或 `border-right` 大于 1px 作为彩色装饰条——不需要侧边条纹来吸引注意。
- **Don't** 把卡片嵌套在卡片里——一层容器足够。
- **Don't** 在非选中态使用高饱和色——灰色元素应该保持中性。
- **Don't** 让 Agent 回复超过 4 句话——迹录不是聊天机器人，是随身助手。
- **Don't** 在底部 Tab 栏以外使用全宽横幅广告或促销提示——这个产品不卖东西。
- **Don't** 模仿钉钉/飞书的灰白工作台 + 列表 + 审批流——那是反参照，不是竞品。

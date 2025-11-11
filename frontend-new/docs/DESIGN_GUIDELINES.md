# 🪷 DhammaFlowSeat Frontend — Design Guidelines

> Version: v0.2 · Reviewed 2025-11-01  
> 本文档规范 DhammaFlowSeat 前端的页面结构、视觉风格与交互逻辑，确保系统在重构与扩展中保持一致性与可维护性。

---

## 1. 信息架构（Information Architecture）

### 1.1 顶层结构
- **布局容器**：`AppShell`（Ant Design Layout）包含侧边栏、顶部 TopBar 与主内容区。
- **侧边栏**：列出核心模块（仪表盘、学员、房间、导入、分配、禅堂、报表），选中状态基于当前路径。
- **顶部栏**：
  - 左侧：系统名称与页面标题。
  - 右侧：`中心`、`课程会期` 下拉选择（由 `AppContext` 管理），以及用户菜单。
- **内容区**：业务页面位于 `src/app/(console)/*`，统一使用卡片/表格布局。

### 1.2 页面分区
| 模块 | 描述 |
|------|------|
| **Dashboard** | 统计卡片 + 快捷操作按钮 |
| **Students** | 学员列表 + 导入/编辑 Modal |
| **Rooms** | 统计区域 + 过滤器 + 房间表格 + 床位 Modal |
| **Import** | 步骤引导 + 上传文件 + 结果展示 |
| **Course Config** | 单列表单 + 动态课程计划列表 |
| **Allocations** | 自动/手动分配、结果查看、冲突处理 |
| **Meditation Seats** | 禅堂座位可视化布局（待完善） |
| **Reports** | 导出与预览模块 |

---

## 2. 视觉设计规范（Visual Design）

### 2.1 字体与基础
- **字体**：`Geist Sans`（via next/font）  
- **字号基线**：14px（Ant Design 默认）  
- **圆角**：`8px`  
- **阴影**：`box-shadow: 0 2px 8px rgba(0,0,0,0.05)`  
- **间距标准**：`xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`

### 2.2 颜色体系（Design Tokens）
| Token | 颜色 | 用途 |
|--------|-------|------|
| `primary` | `#cfa45d` | 法金色，主按钮与高亮 |
| `secondary` | `#b0b0a8` | 禅灰，辅助背景 |
| `success` | `#52c41a` | 操作成功 |
| `warning` | `#faad14` | 提醒 |
| `error` | `#f5222d` | 错误 |
| `male` | `#a4c7c4` | 男众标识 |
| `female` | `#e7c6c2` | 女众标识 |
| `background` | `#f5f5f5` | 页面背景 |
| `text` | `#3a3a3a` | 主文字颜色 |

> 💡 保持整体“禅意极简”风格，主色温润、对比柔和。

### 2.3 组件样式
| 类型 | 样式规范 |
|------|-----------|
| **Card** | 内边距 `16–24px`，背景白，圆角统一 |
| **Table** | 默认分页 20 条，列多时启用 `scroll.x` |
| **Form** | 垂直布局，字段间距 16px；Modal 表单同样使用 |
| **Select** | 宽度 200px（过滤器）或 100%（表单） |
| **Modal** | 使用 `destroyOnHidden`，标题居中 |
| **Alert** | 用于统计或提示（Info/Success/Warning） |
| **Tag** | 状态/性别区分：男蓝、女粉、旧生绿、新生黄 |

---

## 3. 交互逻辑（Interaction & Behavior）

### 3.1 全局状态
- `currentCenter`、`currentSession` 由 `AppContextProvider` 与 `useLocalStorageState` 管理。  
- 页面在未选择中心/会期时显示 `Empty` 状态与提示。  
- 所有数据查询（React Query）需以 `centerId`、`sessionId` 为 key 条件。

### 3.2 表格交互
- `rowKey` 必须使用唯一 ID。  
- 学员编号自定义排序（数字+字母混合）。  
- 操作列统一使用图标按钮 + Tooltip，例如：
```tsx
<Tooltip title="编辑">
  <Button type="text" icon={<EditOutlined />} />
</Tooltip>
```

### 3.3 Modal 表单
- 封装通用组件 `<FormModal>`：自动重置、验证、loading 状态管理。  
- 所有表单关闭时应清理 DOM，提交时通过 `form.validateFields()` 校验。

### 3.4 动态列表（示例）
使用 `Form.List` 管理可增删子表单：
```tsx
<Form.List name="plans">
  {(fields, { add, remove }) => (
    <>
      {fields.map(field => (
        <Card type="inner" key={field.key}>…</Card>
      ))}
      <Button onClick={() => add()}>添加计划</Button>
    </>
  )}
</Form.List>
```

### 3.5 数据导入
- 通过 `Upload.Dragger` + `customRequest` 上传文件。  
- 上传后展示 Steps 流程与结果统计卡片。  

### 3.6 分配模块（待重构）
- 拆分为三个页面：
  1. **控制台 Console**（规则配置 + 一键分配）  
  2. **工作台 Workspace**（手动调整 + 拖拽交互）  
  3. **结果导出 Result**（查看 + 打印）  

### 3.7 禅堂座位
- 采用可视化网格（SVG/Canvas）展示。  
- 支持区域选择、生成、调整、导出。  
- 后续封装为 `SeatLayoutEditor` 组件。

---

## 4. 模块设计要点

### 🏠 房间管理
**目标：** 从表格切换为卡片/可视化布局。
- 左侧：楼栋/性别筛选  
- 主区：房间卡片（显示床位与入住者）  
- 右侧：未分配学员列表（支持拖拽）  
- 推荐使用 `@dnd-kit/core` 实现拖拽操作。

### 🪑 禅堂座位管理
- 行列可配置（例：20×10）。  
- 悬停显示学员信息；空座高亮。  
- 支持导出 PDF / 打印视图。  

---

## 5. 响应式设计（Responsive Design）

| 元素 | 桌面端 | 移动端 |
|------|---------|---------|
| 侧边栏 | 固定展开 | 折叠为 Drawer |
| 过滤区 | 行内过滤 | 折叠为 Drawer |
| 表格 | 多列 | 卡片式列表 |
| Modal | 固定宽 | 全屏显示 |
| 操作栏 | 右上操作按钮 | 底部浮动按钮 |

---

## 6. 文件组织与命名（File & Naming Conventions）

| 目录 | 内容示例 |
|------|-----------|
| `src/components/common/` | 通用组件（`FormModal`, `StatCard`, `FilterBar`） |
| `src/features/rooms/` | 房间模块（`RoomList`, `RoomCard`, `RoomModal`） |
| `src/features/seats/` | 禅堂模块（`SeatMap`, `SeatLegend`, `SeatEditor`） |
| `src/hooks/` | 数据与状态逻辑（`useAllocations`, `useRooms`） |
| **命名规范** | 组件使用 PascalCase；hooks 使用 camelCase。 |

---

## 7. 通用体验规范（UX Principles）

| 原则 | 描述 |
|------|------|
| **少确认，多回退** | 所有操作可撤销，减少重复确认弹窗。 |
| **即时反馈** | 操作成功/失败使用统一提示样式。 |
| **视觉分区明确** | 用颜色区分性别/区域，保持柔和对比。 |
| **触控优先** | 所有交互兼容触控与键盘操作。 |
| **空状态友好** | 未选择会期/无数据时显示引导提示与操作按钮。 |

---

## 8. 建议新增章节（v0.3 预留）

- **Design Tokens & Theme Customization**：集中管理颜色、字体、间距、动画。  
- **Component Usage Guide**：记录表单、表格、卡片的统一使用方式。  
- **Responsive Layout Rules**：定义断点与布局行为。  
- **Accessibility**：确保文字对比度与键盘可导航。  

---

## 9. 修订记录（Changelog）

| 版本 | 日期 | 内容摘要 |
|------|------|-----------|
| v0.1 | 2025-10-XX | 初版文档（自动生成） |
| v0.2 | 2025-11-01 | 增加视觉主题、组件体系、响应式与UX规范；明确重构方向。 |

---

> 📄 本文档为 DhammaFlowSeat 项目的前端设计基准，应与 PRD 与 UI 原型一并维护。  
> 所有新模块开发前应遵循此规范，若有调整请更新版本号与变更说明。

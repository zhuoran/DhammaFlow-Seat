## DhammaFlowSeat – Frontend Rewrite

`frontend-new/` is the modernized console for the禅修中心智能排床系统, rebuilt with **Next.js 16 (App Router)**, **TypeScript (strict)**, **Ant Design 5**, **Tailwind 4**, and **React Query**.  
It replaces the legacy `/frontend` implementation while preserving all operational flows:学生管理、房间与床位管理、手动/自动分配、禅堂座位、报表导出等。

### Tech Decisions

- **App Router + Nested Layouts**：`src/app/(console)/layout.tsx` hosts the Ant Design shell（侧边栏 + 顶部中心/会期选择器）.
- **Server + Client Components**：布局/页面壳子为 RSC，复杂交互封装为 Client 组件。
- **Data Layer**：`src/types` 定义后端 DTO，`src/lib/http.ts` 统一 Axios 实例，`src/services/api/*` 按模块拆分，`src/hooks/queries.ts` 提供 React Query hooks。
- **状态管理**：`AppContextProvider` 负责 `currentCenter/currentSession` 与 localStorage 同步；React Query 负责远端缓存。
- **样式系统**：Tailwind 4 全局基础 + CSS Modules（布局等），Ant Design 主题 Token 控制主色。

### Project Structure

```
src/
├── app/(console)/              # 业务路由 – rooms, students, allocations 等
├── components/
│   ├── layout/                 # AppShell / Sidebar / TopBar
│   ├── common/                 # PageHeader、StatCard
│   ├── rooms|students|allocations|... feature 组件
├── hooks/                      # React Query hooks + localStorage hook
├── lib/                        # env/http/data utils
├── services/api/               # 后端 API 封装
├── state/                      # AppContext + ReactQueryProvider
└── types/                      # Domain DTO & ApiResponse
```

### Commands

```bash
npm install               # 首次安装依赖（建议 Node 20+，需设置 npm_config_cache）
npm run dev               # 本地开发，默认 http://localhost:3000
npm run lint              # ESLint (Next + TypeScript 规则)
npm run build             # 生产构建检查
```

> 提示：后端 API 默认指向 `NEXT_PUBLIC_API_URL`（`.env` 设置，默认为 `http://192.168.2.250:8080/api`）。

### Feature Parity Highlights

- **学员管理**：React Query 表格 + Modal 编辑/Excel 导入（`components/students`）。
- **房间 & 床位**：过滤、统计、展开行内床位管理（`components/rooms`）。
- **分配流程**：自动分配控制台、手动分配 Modal、结果/详情/打印视图（`components/allocations/*`）。
- **数据导入**：Excel Dragger 上传 + 进度步骤（`components/imports/RoomImportPage`）。
- **禅堂座位/报表**：重做的可视化与导出入口。

更多设计笔记与 Legacy 对照参见 `docs/LEGACY_FRONTEND_OVERVIEW.md`。

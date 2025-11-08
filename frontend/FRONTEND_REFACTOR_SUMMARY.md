# Frontend Refactor Summary

> 2025-11-XX – 代码审查结论同步  
> 目标：为接下来的系统性重构提供依据与优先顺序

---

## 现状诊断

- **性能崩坏**
  - `app/allocations/result|print|details` 对每条分配逐条 `await studentApi.getStudent`，典型 N+1，几十条记录就触发几百个串行请求。
  - `app/rooms`、`app/allocations/manual` 展开任意房间都会调用 `bedApi.getBeds()` 拉全量床位，再前端过滤；既慢又没有中心隔离。
  - API 地址在 `allocations/details` 等页面被硬编码为 `http://192.168.2.250`，绕过 Axios 拦截器和环境配置。

- **架构缺陷**
  - 所有页面都是 Client Component，数据请求、业务逻辑、UI 混在 500~700 行巨型组件里，没有 hooks/service 分层。
  - 每个页面手写一遍 `localStorage` hydration 状态，重复且易错。
  - Tailwind/clsx 约定未落实，内联样式铺满，常量映射散落各处。

- **类型与数据一致性**
  - `useState<any[]>` 普遍存在，`types/Room` 仍包含 `reserved` 等已删除字段，与后端实体不符。
  - `allocations/manual` 在 `setStudents` 后立即使用旧 state 做关联，导致 `student` 字段经常为 `undefined`；`allocationsByRoom` 没有按房间过滤。

---

## 重构优先级

1. **数据访问与批量化**
   - 后端新增/开放批量接口：`/allocations` 响应中连带学生 & 床位基本字段，或提供 `/students?ids=`、`/beds?roomId=`。
   - 前端所有访问统一走 `services/api`，禁止硬编码 URL；`bedApi.getBeds` 默认必须传 `roomId` (至少 `centerId`)。

2. **状态与数据层重建**
   - 抽取 `useCurrentContext()` + Provider 统一管理 center/session，从 `MainLayout` 一次性读写 `localStorage`，页面仅消费 context。
   - 编写 `useRooms`, `useBeds`, `useAllocations` 等 hooks，封装请求与缓存，页面只关心渲染。

3. **组件拆分**
   - `rooms/page.tsx`：分离为 `RoomsHeader`, `RoomFilters`, `RoomTable`, `RoomStats`, `RoomModal`, `BedDrawer` 等职责单一组件。
   - `allocations/result|print|manual`：拆出 “数据聚合 + 纯展示” 两层，去除巨型组件。

4. **类型治理**
   - 同步后端实体到 `frontend/types`（`Room.status` 取值、`genderArea`、`Allocation` 的嵌套字段等）。
   - API 返回值全部使用泛型，组件端 `useState<Room[]>` 替换 `any[]`，以便 TypeScript 捕获缺失字段。

5. **Next.js 能力恢复**
   - 纯展示/说明页（仪表盘、报表、导入指引）改为 Server Component，只对需要交互的区域使用 `'use client'`，减小首屏 JS。

6. **样式与常量收敛**
   - 统一通过 Tailwind/clsx 或 CSS 模块实现重复样式，公共文案/映射放入 `constants.ts`。

---

## 建议工作流

1. **接口/类型先行**：确认后端批量接口设计，更新 `services/api` & `types`，保证数据层正确。
2. **Hook + Context**：实现 `useCurrentContext`、`useRooms` 等基础 Hook，替换页面内的重复逻辑。
3. **页面逐个拆分**：按照重要性（房间管理 → 手动/结果/打印 → 详情）重写组件结构并移除 N+1。
4. **性能回归**：对重构后的页面记录请求数、加载耗时，以便与当前版本对比。
5. **文档同步**: 在 `HANDOFF_DOCUMENT.md` 补充新的 API/Hook 约定，方便后续接手人员。

---

## 验收清单

- [ ] `allocations/result|print|details` 加载同一批数据时，网络面板中不再出现按学生/床位的串行请求洪水。
  - 目标：100 条分配以内的页面加载时间 < 2s。
- [ ] `bedApi.getBeds(roomId)` 被所有床位上下文引用；抓包确认只返回当前房间/中心数据。
- [ ] `RoomsPage` 组件主文件 < 300 行，其余逻辑下沉到 Hooks/子组件。
- [ ] 类型同步完成：`tsc --noEmit` 无类型错误，`any` 仅限第三方库。
- [ ] 关键页面通过 `npm run lint && npm run build`。

---

**备注**：如需进一步分阶段计划，可在此文档追加 “里程碑表” 或 `tasklist`，保持与 PR 描述一致。***

# 禅堂布局与座位生成方案

## 1. 背景与目标
- 彻底摆脱 Excel 模板依赖，仍然保持“先房间分配 → 再禅堂座位”流程。
- 让禅堂配置结构化（可版本管理），并提供非技术人员可操作的可视化编辑器。
- 统一后端生成逻辑与前端展示/打印，实现自动校验、警告与报表输出。

## 2. 数据流与前置约束
1. **房间阶段**：`allocation` 表记录每位已分配床位的学员，包含 `roomId`, `bedNumber`, `studentId`, `gender`, `age`, `studentType`, `fellowGroupId`。
2. **禅堂阶段输入**：仅当房间/床位分配完成后，才能生成禅堂座位。若存在未分配学员，需要在验证阶段终止并返回 warning。
3. **输出**：`meditation_seat` 表，字段涵盖 `sessionId`, `hallConfigId`, `regionCode`, `rowIndex`, `colIndex`, `seatNumber`, `studentId`, `bedCode`, `seatType`, `tags`。

## 3. 禅堂配置模型 (`HallLayout`)
| 字段 | 说明 |
|------|------|
| `originRow`, `originCol` | 坐标原点，整数，默认 0。|
| `totalRows`, `totalCols` | 静态网格尺寸；若 `autoRows/autoCols=true` 可根据容量动态增长。|
| `rowSpacing`, `colSpacing` | 打印时的视觉间距，前端参考。|
| `sections[]` | 区域数组。每项：`name`、`purpose`(MONK/OLD/NEW/WORKER/RESERVED)、`rowStart/rowEnd`、`colStart/colEnd`、`fillDirection`(ROW_MAJOR/COL_MAJOR)、`numberingOverride`、`capacity`。|
| `reservedSlots[]` | 需要留空的 (row,col) 或范围。|
| `monkSeats` | `{startRow,startCol,direction,spacing,maxCount,prefix}`，用于法师列。|
| `numbering` | `{mode: sequential/odd/even/abSplit, start, prefix, renumberPolicy: onGenerate/onFinalize/manual}`。section 可覆盖。|
| `highlightRules[]` | 条件（如 `age>=60`、`specialNotes` 包含“怀孕”）→ tag/color，供前端标示。|
| `supportedGenders`, `meditationHallUsage`, `genderSeparated` | 指定本禅堂支持的性别、是否双区分离。

> 配置可存于 `meditation_hall_config` JSON 字段或拆成子表；对外通过 `/hall-configs` API 管理。

## 4. 服务层组件
1. **`LayoutCompiler`**：读取 `HallLayout`，构建 `SeatGrid`（二维结构），并标记 section、reserved、可用槽位。
2. **`SeatAllocator`**：
   - 过滤 `supportedGenders` + `session.course_gender_type`。
   - 顺序填充：法师 → 旧生 → 新生 → 其他 purpose。每填一席记录 `rowIndex`, `colIndex`, `section`, `studentId`, `bedCode`（`roomNumber-bedNumber`）。
   - 超出 section 容量的学员加入 `UnassignedList`。
3. **`SeatNumberingService`**：
   - `assignInitialNumbers(seats, layout)`：生成初始 `seatNumber`。
   - `renumber(sessionId)`：供手动调整后重新编号。
4. **`SeatAnnotationService`**：执行 highlight 规则、同伴标记（仅写 `isWithCompanion`/`companionSeatId`/`statusTag`）。
5. **`ValidationService`**：检查未分配学员、性别错配、重复占座、row/col 溢出、reserved 被占、seatNumber 冲突，返回 warning/error。
6. **数据库操作**：生成前 `deleteBySessionId`，写入阶段使用 `insertBatch`，全程事务包裹。

## 5. API 设计
| API | 说明 |
|-----|------|
| `GET /api/hall-configs?sessionId=` | 返回指定会期下的所有禅堂配置及布局。|
| `PUT /api/hall-configs/{id}/layout` | 保存指定禅堂的布局（sections/reserved/模板信息）。|
| `POST /api/hall-configs/{id}/compile` | 仅编译 SeatGrid，供前端预览，不落库。|
| `POST /api/meditation-seats/generate?sessionId=` | 执行完整生成流程（含验证），返回 summary。|
| `POST /api/meditation-seats/renumber?sessionId=` | 重新编号。|
| `GET /api/meditation-seats/:sessionId?view=grid|list|report` | 提供座位数据，供前端/报表使用。|

返回 `SeatGenerationResult`：`totalSeats`, `occupiedSeats`, `unassignedStudents[]`, `warnings[]`。

## 6. 前端设计
### 6.1 禅堂配置编辑器
- 画布：基于 SVG/Canvas 的网格，支持拖拽框选、设置 section purpose/容量/编号。
- 左侧模板库（女禅堂/男禅堂标准），右侧表单编辑属性。
- 支持标记 reserved slots（点击格子即可）。
- “配置预览”按钮调用 `/compile` 获取 SeatGrid overlay，实时展示容量。

### 6.2 座位查看 & 调整
- Grid 视图：显示 `seatNumber`, `student`, `tags`，支持点击查看详情、交换座位、释放座位。
- List 视图：表格筛选、快速搜索。
- 操作：生成、重新编号、导出打印、同伴分离报告。
- 所有复杂选项使用向导/下拉，减少手工输入。

## 7. 实施计划
1. **阶段1（~1 周）**：扩展配置 schema、实现 `HallLayout` DTO & `LayoutCompiler` 雏形、提供 YAML 示例。评审配置完整性。
2. **阶段2（~1.5 周）**：实现 `SeatAllocator`/`SeatNumberingService`/`SeatAnnotationService`/`ValidationService`，打通 CLI/REST，验证溢出与警告。评审输出结果。
3. **阶段3（~2 周）**：前端配置编辑器（网格画布 + 表单 + 模板 + `/compile` 预览）。评审可操作性。
4. **阶段4（~2 周）**：座位查看/调整页面、打印报表、生成→预览→确认流程。评审端到端 Demo。
5. **阶段5（~1 周）**：文档、自动化测试、培训材料、反馈迭代。

## 8. 清理与维护
- 废弃旧的 Excel 输出文档，只保留本设计和最新交接/PRD。
- 所有配置通过 API/数据库管理，禁止再在代码中硬编码 Excel 坐标。
- 后续扩展：同伴优先算法、模板共享、版本回滚等，可在本方案基础上渐进实现。

# 更新日志 - 2025-11-22

## 修复：禅堂配置持久化

### 问题
用户保存禅堂配置后，刷新页面时配置丢失，需要重新选择模板和设置参数。

### 根本原因
前端虽然从后端加载了已保存的配置（`defaultConfig`），但没有用它来恢复UI状态。

数据流：
```
Backend (已保存) → Frontend加载 → defaultConfig ✅
                                   ↓
                          UI状态恢复 ❌ (缺失)
```

### 解决方案
添加配置恢复逻辑，在组件初始化时从 `defaultConfig` 恢复所有UI状态：

**恢复的状态包括：**
1. **模板类型** (`selectedTemplate`)
   - 'single-gender' (单性课程)
   - 'co-ed' (双性课程)

2. **单性课程配置**
   - `totalRows` - 总行数
   - `totalCols` - 总列数

3. **双性课程配置**
   - `femaleRows`, `femaleCols` - 女众区域行列
   - `maleRows`, `maleCols` - 男众区域行列

4. **布局数据** (`currentLayout`)
   - 完整的区域配置
   - 座位编号规则

### 实现细节

**文件**: `frontend-new/src/components/meditation/MeditationSeatsPage.tsx`

**核心逻辑**:
```typescript
// 标记配置是否已加载（避免重复恢复）
const [configLoaded, setConfigLoaded] = useState(false)

useEffect(() => {
  if (configLoaded || !defaultConfig || !defaultConfig.layout) return
  
  const layout = defaultConfig.layout
  setCurrentLayout(layout)
  
  // 判断模板类型
  const isMixed = layout.sections && layout.sections.length === 2
  if (isMixed) {
    // 双性课程：恢复A/B两个区域的配置
    setSelectedTemplate('co-ed')
    // ... 恢复 femaleRows, femaleCols, maleRows, maleCols
  } else {
    // 单性课程：恢复总行列配置
    setSelectedTemplate('single-gender')
    // ... 恢复 totalRows, totalCols
  }
  
  setConfigLoaded(true)
}, [configLoaded, defaultConfig])
```

**判断逻辑**:
- 如果 `layout.sections.length === 2` → 双性课程 (A区-男众, B区-女众)
- 否则 → 单性课程

**恢复行列数**:
```typescript
const rows = section.rowEnd - section.rowStart
const cols = section.colEnd - section.colStart
```

### 用户体验改进

**之前**:
1. 选择模板 → 设置参数 → 保存配置
2. 刷新页面 → 配置丢失 ❌
3. 需要重新设置

**现在**:
1. 选择模板 → 设置参数 → 保存配置
2. 刷新页面 → 自动恢复所有配置 ✅
3. 可以直接继续编辑或生成座位

### 技术考虑

**React Hooks 规则冲突**:
React Compiler 建议避免在 `useEffect` 中直接调用 `setState`，因为可能导致级联渲染。

但在这个场景中，我们是**从外部数据源恢复状态**（类似从localStorage读取），这是 `useEffect` 的合理用途。

因此使用了 `eslint-disable` 来明确告诉编译器这是预期行为：
```typescript
/* eslint-disable react-hooks/set-state-in-effect */
useEffect(() => {
  // 恢复配置的setState调用
}, [configLoaded, defaultConfig])
/* eslint-enable react-hooks/set-state-in-effect */
```

**防止重复恢复**:
使用 `configLoaded` 标记确保恢复逻辑只执行一次，避免：
- 用户手动修改后被覆盖
- 不必要的重新渲染

### 测试场景

✅ **场景1：首次配置**
- 无已保存配置
- 显示模板选择界面
- 正常流程

✅ **场景2：恢复单性课程配置**
- 加载已保存的单性配置
- 自动选中 "单性课程模板"
- 恢复 totalRows, totalCols
- 预览正确显示

✅ **场景3：恢复双性课程配置**
- 加载已保存的混合园区配置
- 自动选中 "双性课程模板"
- 恢复 femaleRows/Cols, maleRows/Cols
- A区和B区配置正确
- 预览正确显示两个区域

✅ **场景4：配置后修改**
- 恢复配置
- 用户手动调整行列
- 重新生成预览 ✅
- 保存新配置 ✅

### 相关文件
- `frontend-new/src/components/meditation/MeditationSeatsPage.tsx` - 主要修改
- `frontend-new/src/types/domain.ts` - HallConfig 类型定义

### 后端支持
无需修改后端。后端已经正确保存和返回 `layout_config` JSON数据。

---

## Linus式总结

**问题**: 数据在，但没用。  
**方案**: 加载时恢复。  
**结果**: 配置持久化。

"Talk is cheap. Show me the code." ✅


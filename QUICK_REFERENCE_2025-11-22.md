# 快速参考 - 2025-11-22

## 🎯 核心变更速览

### 模板简化
- **旧**: 3个模板（A区女众、B区男众、混合园区）
- **新**: 2个模板（单性课程、双性课程）

### 功能新增
1. ✅ 自动配置生成（根据学员数据）
2. ✅ 配置持久化（刷新后自动恢复）
3. ✅ AB_SPLIT编号（A1/A2... B1/B2...）

### 页面重构
- **旧**: Tab页面（配置/预览/座位）
- **新**: 线性流程（统计→模板→调整→预览）

---

## 📁 关键文件位置

### 前端
```
frontend-new/src/
├── components/meditation/
│   ├── MeditationSeatsPage.tsx      # 主页面（配置）
│   ├── SeatManagementPage.tsx        # 座位管理（独立页面）
│   ├── TemplateSelector.tsx          # 模板选择器
│   └── LayoutPreviewCanvas.tsx       # 预览组件
├── constants/
│   └── hall-templates.ts             # 模板定义（2个）
└── utils/
    └── hall-auto-config.ts           # 自动配置逻辑
```

### 后端
```
backend/src/main/java/cc/vipassana/
├── service/seat/
│   └── SeatNumberingService.java     # AB_SPLIT实现
└── dto/layout/
    └── NumberingMode.java             # 枚举（含AB_SPLIT）
```

---

## 🔑 关键代码片段

### 配置恢复逻辑
```typescript
// MeditationSeatsPage.tsx
useEffect(() => {
  if (configLoaded || !defaultConfig || !defaultConfig.layout) return
  
  const layout = defaultConfig.layout
  const isMixed = layout.sections?.length === 2
  
  if (isMixed) {
    setSelectedTemplate('co-ed')
    // 恢复 femaleRows/Cols, maleRows/Cols
  } else {
    setSelectedTemplate('single-gender')
    // 恢复 totalRows, totalCols
  }
  
  setConfigLoaded(true)
}, [configLoaded, defaultConfig])
```

### AB_SPLIT编号逻辑
```java
// SeatNumberingService.java
if (mode == NumberingMode.AB_SPLIT) {
    assignWithRegionPrefix(seats, sections, config);
}

private void assignWithRegionPrefix(...) {
    Map<String, Integer> regionCounters = new HashMap<>();
    for (MeditationSeat seat : seats) {
        String regionCode = seat.getRegionCode(); // "A" 或 "B"
        int counter = regionCounters.getOrDefault(regionCode, 1);
        seat.setSeatNumber(regionCode + counter); // "A1", "A2", ...
        regionCounters.put(regionCode, counter + 1);
    }
}
```

---

## 🧪 测试检查清单

- [ ] 单性课程：选择模板 → 自动生成 → 保存 → 刷新 → 恢复 ✅
- [ ] 双性课程：选择模板 → 自动生成 → 保存 → 刷新 → 恢复 ✅
- [ ] 手动调整：修改行列 → 重新生成预览 → 保存 ✅
- [ ] 生成座位：保存配置 → 生成座位 → 检查编号（A1/A2... B1/B2...）✅
- [ ] 预览对齐：第1排靠近法座 ✅
- [ ] 座位1号位置：靠近中心过道 ✅

---

## 🐛 常见问题

### Q: 刷新后配置丢失？
**A**: 已修复。现在会自动从 `defaultConfig` 恢复。

### Q: 预览显示的行列数不对？
**A**: 已修复。现在使用 `section.rowEnd - section.rowStart` 计算。

### Q: 男众区编号显示"1-11"？
**A**: 已修复。现在使用网格坐标 `gridRow + 1, gridCol + 1`。

### Q: 座位1号位置不对？
**A**: 已修复。女众区（左）反转列顺序，男众区（右）正常顺序。

---

## 📚 相关文档

- `HANDOVER_2025-11-22.md` - 完整交接文档
- `禅堂配置模板简化设计方案.md` - 设计文档
- `CHANGELOG_2025-11-22_config_persistence.md` - 持久化修复说明

---

**最后更新**: 2025-11-22


# 禅堂座位生成算法 - PRD与实现对比分析

**分析日期**: 2025-11-08
**分析范围**: Excel原始算法 → PRD文档 → 当前实现
**结论**: 当前实现与PRD设计有严重偏差，需要重构

---

## 一、PRD与实现的关键差异

### 1. 学员优先级排序

**PRD要求** (正确):
```
出家师 (Monks)
  ↓
在家旧生 (Old Lay Students) - 按修学次数和年龄排序
  ↓
在家新生 (New Lay Students) - 按年龄排序
```

**当前实现** (错误):
```java
// 直接循环所有学员，不进行优先级排序
for (Student student : students) {
    // 顺序分配，忽略学员类型
    String seatType = "monk".equals(student.getStudentType()) ? "MONK" : "STUDENT";
    // 简单顺序填充座位
}
```

**问题**: 没有按优先级排序，所有学员平等对待

---

### 2. 座位分配策略

**PRD要求** (分三个阶段):

**阶段1: 法师座位**
- 特殊编号: 法1, 法2, 法3...
- 单独成列（左侧）
- 行间距: 3行

**阶段2: 旧生座位** (优先座位)
- 占据前2行
- 水平排列 (左→右)
- 修学经历最丰富的优先

**阶段3: 新生座位** (竖列分配)
- 从禅堂右侧开始
- 竖列从上到下填充
- 填满一列后，移到左边下一列

**当前实现** (错误):
```java
// 简单的行列填充
for (Student student : students) {
    MeditationSeat seat = new MeditationSeat();
    seat.rowIndex = row;    // 简单递增
    seat.colIndex = col;    // 简单递增

    col++;
    if (col >= regionWidth) {
        col = 0;
        row++;
    }
}
```

**问题**:
- 没有三阶段分离
- 没有法师特殊处理
- 没有前排旧生优先
- 没有竖列分配逻辑

---

### 3. 同伴座位处理

**PRD要求**:
- 识别同伴对 (A的companion=B, B的companion=A)
- 同伴优先排到禅堂右侧和底部边缘
- 尽量相邻座位 (行相邻或列相邻)
- 座位表中用相同颜色标记

**当前实现**:
- 完全没有实现

---

### 4. 特殊情况处理

**PRD要求**:
- 孕妇学员: 优先靠近出口和卫生间，标记为红色
- 60岁以上老年人: 靠近出入口
- 同伴对无法相邻: 标记警告
- 座位溢出: 自动扩展或警告

**当前实现**:
- 完全没有实现

---

### 5. 数据库查询性能

**PRD要求**: 性能 < 2秒生成200名学员的座位

**当前实现** (N+1问题):
```java
// 逐个加载学员（行 55-60）
for (Allocation allocation : allocations) {
    Student student = studentMapper.selectById(allocation.getStudentId());  // N+1 查询
    if (student != null) {
        students.add(student);
    }
}
```

**问题**:
- 若100名学员，执行101次数据库查询
- 应该使用: `studentMapper.selectByIds(studentIds)` 批量查询

---

## 二、Excel原始算法的关键特性

基于对Excel文件的分析，实际算法包含：

### 1. 配置参数
```
regionWidth: 列数 (例如8列)
regionRows: 行数 (例如10行或自动)
X偏移, Y偏移: 座位的物理偏移量
最大行, 最大列: 布局限制
法师起始位置: 法师座位的起始位置
```

### 2. 座位编号方案
```
顺序编号: 1, 2, 3, 4, 5...
奇数编号: 1, 3, 5, 7, 9... (A区)
偶数编号: 2, 4, 6, 8, 10... (B区)
法师编号: 法1, 法2, 法3...
```

### 3. 学员数据准备
```
要素: 编号(如B1), 姓名, 年龄, 城市, 课程次数, 身份(旧生/新生), 同伴关系, 特殊备注
排序: 法师 → 旧生(按经验降序) → 新生(按年龄降序)
```

---

## 三、PRD设计的正确性评估

**结论**: PRD设计与Excel原始算法基本一致，设计是正确的

**证据**:
1. ✅ 三阶段分离 (法师→旧生→新生)
2. ✅ 优先级排序逻辑正确
3. ✅ 竖列分配逻辑正确
4. ✅ 编号方案覆盖所有类型
5. ✅ 特殊情况处理考虑周全

**设计评分**: 9/10 (非常完善)

---

## 四、当前实现的问题总结

| 问题 | 严重性 | 影响范围 | 修复工作量 |
|------|--------|---------|-----------|
| 没有优先级排序 | 🔴 P0 | 算法核心 | 高 |
| 没有三阶段分离 | 🔴 P0 | 算法核心 | 高 |
| 没有法师特殊处理 | 🔴 P0 | 功能缺陷 | 中 |
| 没有同伴处理 | 🟡 P1 | 功能缺陷 | 高 |
| N+1查询问题 | 🟡 P1 | 性能问题 | 低 |
| 没有特殊情况处理 | 🟡 P1 | 功能缺陷 | 高 |
| 没有容量溢出检测 | 🟡 P2 | 边界情况 | 中 |

**总体评分**: 当前实现完成度约30% (核心算法未实现)

---

## 五、修复方案

### Phase 1 (必须): 实现核心算法
**目标**: 实现PRD中的三阶段座位分配

1. **步骤1**: 重构 `generateRegionSeats()` 方法
   - 分离学员为三组 (monks, oldStudents, newStudents)
   - 按优先级排序每组

2. **步骤2**: 实现法师座位分配
   - 生成座位号: 法1, 法2, 法3...
   - 计算位置: row = index * rowOffset + 1, col = 0

3. **步骤3**: 实现旧生座位分配
   - 前2行水平排列
   - 编号: 旧1, 旧2, 旧3...

4. **步骤4**: 实现新生座位分配
   - 竖列从右到左填充
   - 编号: 新1, 新2, 新3...

### Phase 2 (推荐): 性能和特性优化
**目标**: 修复N+1问题，添加同伴处理

5. **步骤5**: 批量查询优化
   - 使用 `selectByIds()` 一次查询所有学员

6. **步骤6**: 同伴座位处理
   - 识别同伴对
   - 优先排到禅堂右侧

### Phase 3 (可选): 完整特性
**目标**: 实现所有特殊情况处理

7. **步骤7**: 特殊标记处理
   - 孕妇、年长者等

8. **步骤8**: 容量溢出检测
   - 自动扩展或警告

---

## 六、实现建议

### 关键改进点

#### 1. 学员分组和排序
```java
// 按优先级分组
List<Student> monks = students.stream()
    .filter(s -> "monk".equals(s.getStudentType()))
    .collect(Collectors.toList());

List<Student> oldStudents = students.stream()
    .filter(s -> "old_student".equals(s.getStudentType()))
    .sorted((a, b) -> {
        // 修学次数多优先
        int experienceDiff = Integer.compare(
            b.getTotalStudyCount(), a.getTotalStudyCount()
        );
        if (experienceDiff != 0) return experienceDiff;
        // 年龄大优先
        return Integer.compare(b.getAge(), a.getAge());
    })
    .collect(Collectors.toList());

List<Student> newStudents = students.stream()
    .filter(s -> "new_student".equals(s.getStudentType()))
    .sorted((a, b) -> Integer.compare(b.getAge(), a.getAge()))  // 年龄大优先
    .collect(Collectors.toList());
```

#### 2. 三阶段座位分配
```java
// 阶段1: 法师座位
for (int i = 0; i < monks.size(); i++) {
    int row = i * ROW_OFFSET + 1;  // 3行间距
    int col = 0;
    String seatNumber = "法" + (i + 1);
    // 创建座位
}

// 阶段2: 旧生座位 (前两行)
int seatIndex = 1;
for (int row = 1; row <= 2; row++) {
    for (int col = 0; col < regionWidth; col++) {
        if (seatIndex <= oldStudents.size()) {
            String seatNumber = generateSeatNumber(seatIndex, config);
            // 创建座位
            seatIndex++;
        }
    }
}

// 阶段3: 新生座位 (竖列，右到左)
int currentCol = regionWidth - 1;
int currentRow = 3;  // 从第3行开始
for (Student student : newStudents) {
    String seatNumber = generateSeatNumber(seatIndex, config);
    // 创建座位

    currentRow++;
    if (currentRow > regionRows) {
        currentCol--;
        currentRow = 3;
    }
    seatIndex++;
}
```

#### 3. 批量数据查询
```java
// 改进: 一次查询所有学员
List<Long> studentIds = allocations.stream()
    .map(Allocation::getStudentId)
    .collect(Collectors.toList());
List<Student> students = studentMapper.selectByIds(studentIds);  // 一次查询
```

---

## 七、验证清单

实现完成后，验证以下场景:

- [ ] ✅ 基础场景: 单性别75名学员(法师3+旧生25+新生49)
- [ ] ✅ 优先级排序: 旧生按经验排序，新生按年龄排序
- [ ] ✅ 座位号生成: 法1-法3, 旧1-旧25, 新1-新49
- [ ] ✅ 同伴处理: 同伴对相邻座位，聚集右侧
- [ ] ✅ 特殊标记: 孕妇/年长者标记
- [ ] ✅ 容量溢出: 自动扩展或警告
- [ ] ✅ 性能指标: 生成 < 2秒，修改 < 100ms
- [ ] ✅ N+1解决: 使用批量查询

---

## 总结

**当前状态**: 实现仅完成30%，缺少核心算法
**PRD质量**: 非常好，设计与Excel算法一致
**修复时间**: 预计2-3小时核心功能，额外2小时测试
**优先级**: P0 - 必须重构算法实现

**建议**:
1. 优先实现三阶段座位分配 (核心)
2. 其次修复N+1问题 (性能)
3. 再次实现同伴处理 (功能)
4. 最后补充特殊情况 (完整性)


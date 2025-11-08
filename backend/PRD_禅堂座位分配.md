# 禅堂座位分配系统 - 产品需求文档 (PRD)

**版本**: 1.0
**日期**: 2025-11-07
**基于**: Excel VBA 自动安排系统算法分析
**参考实现**: `/Users/zoran/Developer/workspace/vipassana_workspace/vipassana_excel_macros/郑州昙钟中心自动安排2025.xls`

---

## 目录

1. [功能概述](#功能概述)
2. [核心需求](#核心需求)
3. [数据模型](#数据模型)
4. [业务规则](#业务规则)
5. [算法详解](#算法详解)
6. [API设计](#api设计)
7. [前端需求](#前端需求)
8. [性能指标](#性能指标)
9. [测试用例](#测试用例)

---

## 功能概述

### 背景
禅堂座位分配是禅修中心学员管理的最后一步，在学员房间分配完成后进行。系统需要：
1. 将已分配床位的学员安排到禅堂冥想大厅内的特定座位
2. 考虑学员身份、年龄、修学经历、同伴关系等多个因素
3. 自动生成座位编号和可打印的座位表
4. 支持座位调整和交换功能

### 核心价值
- **自动化**: 完全取代手工排座位（原Excel VBA）
- **科学性**: 遵循既定的优先级规则，确保公平合理
- **灵活性**: 支持手工调整和特殊需求处理
- **可追溯**: 生成完整的审计日志和报表

### 系统集成位置
```
学员注册数据 → 房间分配 → 床位分配 → [禅堂座位分配] ← 禅堂配置
                                        ↓
                                    座位表报表
                                    (打印、导出)
```

---

## 核心需求

### 需求 1: 学员信息准备
**优先级**: P0 (必须)
**描述**: 系统需要获取已分配床位的学员完整信息

**输入数据**:
- sessionId: 课程期次ID
- 学员列表 (已分配房间/床位的学员)

**输入字段**:
```java
{
  id: 学员ID,
  name: 姓名,
  gender: 性别 (M/F),
  age: 年龄,
  ageGroup: 年龄组 (18-30, 30-40, 40-55, 60+),
  studentType: 学员类型 (monk, old_student, new_student),

  // 修学经历
  course10dayTimes: 10天课程次数,
  course4mindfulnessTimes: 4天课程次数,
  course20dayTimes: 20天课程次数,
  course30dayTimes: 30天课程次数,
  course45dayTimes: 45天课程次数,

  // 房间分配信息
  allocation: {
    bedId: 床位ID,
    roomId: 房间ID,
    roomNumber: 房间号,
    buildingArea: 区域 (新区/旧区)
  },

  // 特殊信息
  companion: 同伴学员ID,
  specialNotes: 特殊备注 (孕妇、身体状况等),
  priority: 优先级
}
```

**处理逻辑**:
- 验证所有必需字段完整
- 检查学员是否已分配床位
- 提取修学总次数: `totalStudies = course10dayTimes + course4mindfulnessTimes + course20dayTimes + course30dayTimes + course45dayTimes`

---

### 需求 2: 禅堂配置加载
**优先级**: P0 (必须)
**描述**: 从禅堂配置表读取当前禅堂的布局和规则参数

**配置数据模型**:
```java
@Data
public class MeditationHallConfig {
  // 基本信息
  Long id;
  Long centerId;
  String regionCode;      // A, B, C等区域标识
  String regionName;      // 区域名称（女众A区、男众B区等）
  String genderType;      // M (男), F (女), mixed (混合)

  // 布局参数
  Integer regionWidth;    // 区域宽度（列数）
  Integer regionRows;     // 区域高度（行数）
  Boolean isAutoWidth;    // 是否自动计算宽度
  Boolean isAutoRows;     // 是否自动计算行数

  // 编号方案
  String numberingType;   // sequential(1,2,3), odd(1,3,5), even(2,4,6)
  String seatPrefix;      // 座位前缀 (A, B, C等)

  // 特殊座位
  Integer monkSeats;      // 法师座位数
  String monkSeatPrefix;  // 法师座位前缀 (法)

  // 预留座位范围
  String oldStudentReservedRange;  // 旧生预留座位区域

  // 法工座位
  String dharmaWorkerArea1;
  String dharmaWorkerArea2;
}
```

**配置来源**:
- 数据库表: `meditation_hall_config`
- 由管理员在"禅堂配置"页面维护

**加载流程**:
1. 按sessionId查询当前期次的所有禅堂配置
2. 区分男众/女众配置
3. 若有多个区域(A/B)，分别加载
4. 验证配置参数完整性

---

### 需求 3: 学员排序和分组
**优先级**: P0 (必须)
**描述**: 按优先级规则对学员进行排序和分组

**排序规则**:
```
第一级: 学员身份
  出家师 (monks)
    ↓
  在家生-旧生 (old_students)
    ↓
  在家生-新生 (new_students)

第二级: 修学经历 (仅旧生)
  按总修学次数降序 (多次 → 少次)
  相同次数按年龄降序 (年长 → 年轻)

第三级: 年龄 (仅新生)
  按年龄降序 (年长 → 年轻)
```

**分组输出**:
```
Group 1: 出家师     [Monk1, Monk2, ...]
Group 2: 旧生       [OldStu1, OldStu2, ...]  (按经验排序)
Group 3: 新生       [NewStu1, NewStu2, ...]  (按年龄排序)
```

**数据结构**:
```java
@Data
public class StudentGroup {
  List<Student> monks;              // 出家师
  List<Student> oldLayStudents;     // 在家旧生
  List<Student> newLayStudents;     // 在家新生

  Map<Integer, List<Student>> companionGroups;  // 同伴分组
  Integer totalExperienceScore;     // 总修学分数
}
```

---

### 需求 4: 座位编号生成
**优先级**: P0 (必须)
**描述**: 按照配置的编号方案生成座位编号

**编号方案**:
1. **顺序编号** (Sequential)
   - 座位号: 1, 2, 3, 4, 5, 6...
   - 用途: 单性别禅堂

2. **奇数编号** (Odd)
   - 座位号: 1, 3, 5, 7, 9...
   - 用途: 男女分区禅堂中的A区

3. **偶数编号** (Even)
   - 座位号: 2, 4, 6, 8, 10...
   - 用途: 男女分区禅堂中的B区

**完整座位号**:
```
格式: [前缀][号码]
示例: A1, A3, A5, B2, B4, B法1, B法2
```

**生成逻辑**:
```java
for (int i = 1; i <= totalSeats; i++) {
  if (numberingType.equals("odd")) {
    number = i * 2 - 1;  // 1, 3, 5, 7...
  } else if (numberingType.equals("even")) {
    number = i * 2;      // 2, 4, 6, 8...
  } else {
    number = i;          // 1, 2, 3, 4...
  }
  String seatNumber = seatPrefix + number;  // A1, B3, etc.
}
```

---

### 需求 5: 座位排列 - 法师座位
**优先级**: P1
**描述**: 为出家师分配专门的法师座位（通常在禅堂最前面）

**规则**:
- 法师座位单独成一列（左侧）
- 从上到下依次编号: 法1, 法2, 法3...
- 最多monkSeats个座位
- 预留座位间距: 3行（RowOffset=3）

**输出**:
```
行位置  列位置  座位号  学员名
1      左列    法1     (法师名1)
4      左列    法2     (法师名2)
7      左列    法3     (法师名3)
...
```

**处理流程**:
```
For i = 0 to monks.size() - 1:
  If i >= monkSeats:
    Overflow handling (见需求 10)
  Else:
    seatNumber = monkSeatPrefix + (i + 1)  // 法1, 法2...
    rowPosition = i * rowOffset + 1
    colPosition = 0 (leftmost)
    Create MeditationSeat(rowPosition, colPosition, seatNumber)
```

---

### 需求 6: 座位排列 - 旧生座位 (优先座位)
**优先级**: P0 (必须)
**描述**: 为修学经验丰富的旧生分配禅堂前排的优先座位

**规则**:
- 最有经验的旧生坐在禅堂前面
- 占据前2×列数 (2 rows × regionWidth columns)
- 可选: 有单独的"旧生预留区"

**座位分配顺序**:
```
排2: [旧生1] [旧生2] [旧生3] ... [旧生W]     (W = regionWidth)
排1: [旧生W+1] ... [旧生2W]
排3: [旧生2W+1] ... [旧生3W]
```

**处理流程**:
```
oldStudentIndex = monkCount
oldStudentRows = 2

For row = 1 to oldStudentRows:
  For col = 1 to regionWidth:
    If oldStudentIndex < totalOldStudents:
      Assign oldStudent to (row, col)
      oldStudentIndex++
    Else:
      Stop
```

---

### 需求 7: 座位排列 - 新生座位 (竖列分配)
**优先级**: P0 (必须)
**描述**: 新生按竖列从右到左依次排列，便于同伴学员相邻坐

**规则**:
- 新生从禅堂右侧开始，从上到下填充
- 填满一列后，移到左边下一列
- 用途: 便于同伴学员相邻、方便查找

**排列示例** (3列×4行):
```
         新1  新4  新7
         新2  新5  新8
         新3  新6  新9
            ...
```

**处理流程**:
```
newStudentIndex = oldStudentIndex
currentCol = regionWidth - 1  // 从最右列开始
currentRow = oldStudentRows + 1

For each newStudent:
  Assign to (currentRow, currentCol)
  currentRow += rowOffset

  If currentRow > maxRows:
    currentCol -= 1              // 移到左边
    currentRow = oldStudentRows + 1

  newStudentIndex++
```

---

### 需求 8: 同伴座位处理
**优先级**: P1
**描述**: 处理要求一起坐的学员对（同伴或夫妇）

**识别机制**:
- 字段: `companion` (同伴学员ID)
- 若A学员的companion = B，B学员的companion = A，则为有效同伴对

**排列策略**:
1. **聚集到禅堂边缘**: 同伴对优先排到禅堂右侧和底部边缘
2. **相邻座位**: 尽量将同伴放在相邻位置（行相邻或列相邻）
3. **新生优先**: 处理新生同伴对，将他们聚集到右侧列

**处理流程**:
```
companionGroups = identifyCompanionGroups(students)

For companionGroup in companionGroups:
  // 重新排序，将同伴对移到新生数组前面
  prioritizeInNewStudents(companionGroup)

When assigning seats:
  // 为同伴对分配相邻座位
  assignAdjacentSeats(companionGroup)
```

**视觉标识**:
- 用颜色标记同伴对（在电子版座位表中）

---

### 需求 9: 特殊情况处理
**优先级**: P1
**描述**: 处理特殊学员和边界情况

**特殊情况 1: 孕妇学员**
- 标记: `specialNotes` 包含 "孕"
- 处理:
  - 优先分配靠近出口和卫生间的座位
  - 在座位表中标记（红色背景）
  - 在教师名单中添加备注

**特殊情况 2: 身体不适学员**
- 标记: `specialNotes` 包含其他健康信息
- 处理:
  - 添加座位表注释说明
  - 在教师通知中体现

**特殊情况 3: 坐满溢出**
- 若学员数 > 禅堂容量
- 处理:
  - 标记为"溢出"状态
  - 在座位表中用警示颜色标记
  - 需要人工调整或扩展配置

**特殊情况 4: 年龄≥60的新生**
- 规则: 必须分配到"旧区"（实际房间分配的结果）
- 影响: 可能无法与年轻同伴相邻（如有配偶）

**特殊情况 5: 多区域禅堂(A/B)**
- 规则: 男众A/B区分别编号（奇数/偶数）
- 处理: 分别调用座位生成逻辑，不同区域编号不重复

---

### 需求 10: 溢出处理和容量管理
**优先级**: P2
**描述**: 处理禅堂容量不足的情况

**溢出场景**:
1. **法师座位溢出**: 法师数 > monkSeats
2. **禅堂座位溢出**: 在家生数 > regionWidth × regionRows

**处理方案**:
1. **可扩展配置**:
   - 系统检测容量不足
   - 支持自动增加行数（isAutoRows = true）
   - 支持动态调整列数（isAutoWidth = true）

2. **自动调整**:
   ```
   if (totalSeats > regionWidth × regionRows) {
     // 场景A: 列数固定，增加行数
     if (!isAutoRows) newRows = ceil(totalSeats / regionWidth);

     // 场景B: 行数固定，增加列数
     if (!isAutoWidth) newCols = ceil(totalSeats / regionRows);

     // 场景C: 都可自动，保持接近正方形
     if (isAutoWidth && isAutoRows) {
       newCols = ceil(sqrt(totalSeats));
       newRows = ceil(totalSeats / newCols);
     }
   }
   ```

3. **警告提示**:
   - 返回警告信息: "座位不足 N 个，请调整配置或增加禅堂区域"
   - 前端显示警告对话框
   - 生成的座位表标记溢出座位

4. **部分分配**:
   - 容量不足时，仅分配容量内的座位
   - 剩余学员标记为"待分配"
   - 支持手工调整后重新生成

---

### 需求 11: 座位表生成与导出
**优先级**: P0 (必须)
**描述**: 生成可视化的座位表报表

**座位表格式**:
```
┌─────────────────────────────────────┐
│  禅堂座位表                          │
│  期次: 2025-11-01 十日课程 (女众)   │
│  生成时间: 2025-11-07 16:30         │
├─────────────────────────────────────┤
│  法1    [法师名1]                    │
│  (年龄)  (城市)                      │
│                                     │
│  旧1    旧5    旧9    新1    新4    │
│  [名]   [名]   [名]   [名]   [名]  │
│  (30)   (35)   (45)   (28)   (32)  │
│  浙州    北京    上海    杭州    深圳 │
│                                     │
│  旧2    旧6    旧10   新2    新5    │
│  ...                                │
└─────────────────────────────────────┘
```

**导出格式**:
1. **PDF** - 用于打印
2. **Excel** - 用于后续编辑
3. **HTML** - 用于在线查看

**包含的信息**:
- 学员编号
- 学员姓名
- 年龄
- 城市
- 座位类型标记（法师、旧生等）
- 特殊标记（同伴、孕妇等）

---

### 需求 12: 座位调整和交换
**优先级**: P1
**描述**: 支持手动调整学员座位

**功能 1: 单个座位编辑**
```
PUT /api/meditation-seats/{id}
Request:
{
  seatNumber: "A5",
  studentId: 123,
  notes: "后排靠近出口"
}
Response:
{
  id: 1,
  seatNumber: "A5",
  studentId: 123,
  status: "success"
}
```

**功能 2: 座位交换**
```
POST /api/meditation-seats/swap
Request:
{
  seatId1: 10,
  seatId2: 15
}
Response:
{
  seatId1: { studentId: 456, seatNumber: "A10" },
  seatId2: { studentId: 123, seatNumber: "A15" },
  message: "交换成功"
}
```

**功能 3: 批量调整**
```
POST /api/meditation-seats/batch-adjust
Request:
{
  adjustments: [
    { seatId: 10, studentId: 456 },
    { seatId: 15, studentId: 789 },
    ...
  ]
}
```

**验证规则**:
- 不能交换不同性别学员座位（男众/女众不混)
- 不能破坏同伴座位相邻性（可选，由管理员控制）
- 法师座位不能分配给非法师学员

---

### 需求 13: 报表和统计
**优先级**: P2
**描述**: 生成管理员需要的各类报表

**报表 1: 座位统计**
```
总学员数: 77
出家师: 3
在家旧生: 25
在家新生: 49

禅堂容量: 80
已分配: 77
未分配: 0
分配率: 96.25%

特殊标记:
- 孕妇: 1人
- 身体不适: 2人
- 同伴对: 5对 (10人)
```

**报表 2: 教师学员清单**
```
按座位号排序的学员列表（供教师使用）
座位  姓名    年龄  城市    备注
法1   释朗妙  35   河南
法2   释悟云  42   浙江
A1    张三    28   杭州    新生
A2    李四    32   北京    旧生，同伴(与A3)
A3    王五    31   北京    旧生，同伴(与A2)
...
```

**报表 3: 问卷和法务用表**
```
按座位号顺序生成法务用表
学员号、姓名、性别、年龄、修学次数、座位号等
```

---

## 数据模型

### 1. MeditationSeat 实体
```java
@Entity
@Table(name = "meditation_seat")
@Data
public class MeditationSeat {
  @Id
  Long id;

  @Column(name = "session_id")
  Long sessionId;           // 课程期次

  @Column(name = "center_id")
  Long centerId;            // 禅修中心

  @Column(name = "student_id")
  Long studentId;           // 学员ID

  @Column(name = "hall_config_id")
  Long hallConfigId;        // 禅堂配置ID

  @Column(name = "region_code")
  String regionCode;        // 区域代码 (A, B, C)

  @Column(name = "seat_number")
  String seatNumber;        // 座位号 (A1, A3, 法1等)

  @Column(name = "row_position")
  Integer rowPosition;      // 行位置

  @Column(name = "col_position")
  Integer colPosition;      // 列位置

  @Column(name = "seat_type")
  String seatType;          // 座位类型 (student, monk, dharma_worker)

  @Column(name = "age_group")
  String ageGroup;          // 年龄组 (18-30, 30-40, 40-55, 60+)

  @Column(name = "gender")
  Character gender;         // 性别 (M, F)

  @Column(name = "is_with_companion")
  Boolean isWithCompanion;  // 是否有同伴

  @Column(name = "companion_seat_id")
  Long companionSeatId;     // 同伴座位ID

  @Column(name = "status")
  String status;            // 状态 (available, allocated, reserved)

  @Column(name = "notes")
  String notes;             // 备注

  @Column(name = "created_at")
  LocalDateTime createdAt;

  @Column(name = "updated_at")
  LocalDateTime updatedAt;
}
```

### 2. MeditationHallConfig 实体
见需求2中的数据模型

### 3. DTO: GenerateSeatsRequest
```java
@Data
public class GenerateSeatsRequest {
  Long sessionId;              // 必需
  List<Long> hallConfigIds;    // 可选，若为空则自动加载该session的所有config
  Boolean overwrite;           // 是否覆盖现有座位
  String strategy;             // 分配策略 (auto, manual, custom)
}
```

### 4. DTO: GenerateSeatsResponse
```java
@Data
public class GenerateSeatsResponse {
  Boolean success;
  String message;

  Integer totalStudents;
  Integer allocatedSeats;
  Integer failedAllocations;

  List<MeditationSeatDTO> seats;
  List<String> warnings;       // 警告信息 (如容量不足)
  List<String> errors;         // 错误信息

  Long generatedAt;
  String generatedBy;
}
```

### 5. DTO: MeditationSeatDTO
```java
@Data
public class MeditationSeatDTO {
  Long id;
  Long sessionId;
  Long studentId;
  String studentName;
  Integer studentAge;
  String studentCity;
  String seatNumber;
  Integer rowPosition;
  Integer colPosition;
  String seatType;
  String status;
  String regionCode;
}
```

---

## 业务规则

### 规则集 1: 学员优先级
```
出家师 (Monks)
  ↓ 优先级递减
在家旧生 (Old Lay Students)
  ↓
在家新生 (New Lay Students)
```

**详细规则**:
- 出家师: 始终最先排列，专用法师座位列
- 在家旧生: 修学次数多的优先，相同次数按年龄递减
- 在家新生: 年龄递减排列，年长学员坐在年轻学员前方

### 规则集 2: 年龄和年龄组
```
Age Thresholds:
  18-30: 青年
  30-40: 中年
  40-55: 中老年
  60+:   老年 (特殊处理)

特殊规则:
  - 年龄≥60的新生必须分配到"旧区"（如有此区域）
  - 年龄≥60可能获得靠近出入口的座位
```

### 规则集 3: 同伴座位
```
识别: Student.companion = 另一学员ID
处理:
  1. 确保同伴对相邻（行相邻或列相邻）
  2. 同伴对优先排到禅堂右侧（便于协调）
  3. 同伴对在座位表中用相同颜色标记

特殊情况:
  - 跨性别同伴对(夫妇): 在男众/女众分表中无法相邻
    → 解决方案: 在"合并表"模式或并排展示
  - 3人及以上同伴组: 按同样逻辑聚集
  - 无法满足相邻: 标记为"同伴分离"警告
```

### 规则集 4: 座位排列顺序
```
阶段 1: 法师座位 (最左侧单列)
  法1, 法2, 法3, ...

阶段 2: 旧生座位 (前2行，从左到右)
  第1行: 旧1, 旧2, 旧3, ...旧W  (W = 列宽)
  第2行: 旧W+1, ..., 旧2W

阶段 3: 新生座位 (右侧竖列，从右到左)
  最右列: 新1, 新2, 新3, ...
  次右列: 新(k+1), 新(k+2), ...
  ... (从上到下，从右到左)
```

### 规则集 5: 编号方案
```
顺序编号 (Sequential): 1, 2, 3, 4, 5...
奇数编号 (Odd): 1, 3, 5, 7, 9...
偶数编号 (Even): 2, 4, 6, 8, 10...

用途:
  - 顺序: 单性别禅堂或未分区禅堂
  - 奇数: 男女分区禅堂的A区(男)
  - 偶数: 男女分区禅堂的B区(女)

目的: 避免男女禅堂座位号重复
```

### 规则集 6: 容量和溢出
```
基础容量 = regionWidth × regionRows

溢出处理:
  - 若学员数 > 基础容量
  - 检查 isAutoWidth 和 isAutoRows
  - 自动扩展行数或列数
  - 若无法自动扩展，标记警告并返回

警告标记:
  - 返回 warnings 列表
  - 前端显示警告对话框
  - 生成的座位表中溢出座位标记为红色/黄色
```

### 规则集 7: 特殊座位保留
```
法师座位: 仅供出家师使用
旧生预留座位: 供修学资深的旧生使用
法工座位: 为法务工作人员预留
空座位: 某些座位可能保留为空（寺院特殊安排）
```

---

## 算法详解

### 总体流程图
```
┌─────────────────────────────────┐
│  开始: 座位生成请求              │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段1: 加载和验证              │
│  - 加载session学员              │
│  - 加载禅堂配置                 │
│  - 验证数据完整性               │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段2: 学员排序分组            │
│  - 分离法师/在家生              │
│  - 分离旧生/新生                │
│  - 按经历/年龄排序              │
│  - 识别同伴对                   │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段3: 计算座位布局            │
│  - 计算禅堂尺寸                 │
│  - 自动调整行列                 │
│  - 验证容量                     │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段4: 生成座位编号            │
│  - 法师座位: 法1, 法2...        │
│  - 旧生座位: 按编号方案         │
│  - 新生座位: 按编号方案         │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段5: 分配学员到座位          │
│  - 法师 → 法师座位              │
│  - 旧生 → 前排座位              │
│  - 新生 → 右侧竖列              │
│  - 同伴处理                     │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  阶段6: 生成报表                │
│  - 创建座位表                   │
│  - 创建统计报告                 │
│  - 记录警告和错误               │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  返回: 座位生成结果              │
│  - seats[], warnings[], errors[]│
└─────────────────────────────────┘
```

### 算法 1: 学员排序
```
Input: List<Student> students, Long sessionId

1. 分离学员三组:
   monks = []
   oldLayStudents = []
   newLayStudents = []

   for student in students:
     if student.studentType == 'monk':
       monks.add(student)
     else if student.studentType == 'old_student':
       oldLayStudents.add(student)
     else:
       newLayStudents.add(student)

2. 排序 oldLayStudents (旧生):
   Sort by:
     a) totalExperience DESC (修学次数多的优先)
     b) age DESC (年龄大的优先)

3. 排序 newLayStudents (新生):
   Sort by:
     age DESC (年龄大的优先)

4. 识别同伴对:
   for i = 0 to students.length:
     for j = i+1 to students.length:
       if students[i].companion == students[j].id
          AND students[j].companion == students[i].id:
         companionGroup[groupId] = [i, j]
         groupId++

Output:
{
  monks: List<Student>,           // 已排序
  oldLayStudents: List<Student>,  // 已排序
  newLayStudents: List<Student>,  // 已排序
  companionGroups: Map<Integer, List<Student>>
}
```

### 算法 2: 座位布局计算
```
Input:
  totalLayStudents: int (在家生总数)
  config: MeditationHallConfig

Output:
  CHANROWS: int (行数)
  CHANCOLS: int (列数)

Logic:
1. 获取基础参数:
   CHANCOLS = config.regionWidth or 0
   CHANROWS = config.regionRows or 0
   isAutoWidth = config.isAutoWidth
   isAutoRows = config.isAutoRows

2. 若未指定尺寸，自动计算:
   if CHANCOLS == 0:
     CHANCOLS = 8  // 默认列数

   if CHANROWS == 0:
     if isAutoRows:
       CHANROWS = ceil(totalLayStudents / CHANCOLS)
     else:
       CHANROWS = config.regionRows

3. 验证容量:
   maxCapacity = CHANCOLS × CHANROWS

   if totalLayStudents > maxCapacity:
     if isAutoRows:
       CHANROWS = ceil(totalLayStudents / CHANCOLS)
     else if isAutoWidth:
       CHANCOLS = ceil(totalLayStudents / CHANROWS)
     else:
       WARNINGS.add("座位不足 " + (totalLayStudents - maxCapacity))
       // 仍然继续分配，但标记警告

4. 计算旧生占用行数:
   oldStudentRows = ceil(totalOldStudents / CHANCOLS)
   if oldStudentRows < 2:
     oldStudentRows = 2  // 最少2行预留给旧生

5. 计算新生可用行数:
   newStudentRows = CHANROWS - oldStudentRows - 1

6. 上下界检查:
   CHANROWS = min(CHANROWS, config.regionWidth × config.regionRows)
   CHANCOLS = min(CHANCOLS, config.regionWidth × config.regionRows)

Output:
{
  CHANROWS,
  CHANCOLS,
  oldStudentRows,
  newStudentRows,
  maxCapacity
}
```

### 算法 3: 座位分配 - 旧生(前排)
```
Input:
  oldLayStudents: List<Student>  // 已排序
  CHANCOLS: int
  seatPrefix: String
  numberingType: String

Output:
  List<MeditationSeat> seatList

Logic:
1. 初始化:
   seatIndex = 1
   colIndex = 0
   rowIndex = 0

2. 前两行分配 (水平排列):
   for row = 0 to min(2, CHANROWS-1):
     for col = 0 to CHANCOLS-1:
       if seatIndex <= oldLayStudents.size():
         student = oldLayStudents[seatIndex - 1]

         // 生成座位号
         seatNumber = generateSeatNumber(seatIndex, seatPrefix, numberingType)

         // 计算物理位置
         physicalRow = row * 3 + 1  // 3为行间距
         physicalCol = col * 4      // 4为列间距

         // 创建座位记录
         seat = new MeditationSeat(
           studentId = student.id,
           seatNumber = seatNumber,
           rowPosition = physicalRow,
           colPosition = physicalCol,
           seatType = "student",
           status = "allocated"
         )
         seatList.add(seat)
         seatIndex++
       else:
         break

3. 后续行分配 (补充旧生):
   for row = 2 to CHANROWS-2:
     for col = 0 to CHANCOLS-1:
       if seatIndex <= oldLayStudents.size():
         // 同上逻辑
         seatIndex++
       else:
         break

Output: seatList
```

### 算法 4: 座位分配 - 新生(竖列)
```
Input:
  newLayStudents: List<Student>  // 已排序
  companionGroups: Map<Integer, List<Student>>
  CHANCOLS: int
  oldStudentRows: int
  seatPrefix: String
  numberingType: String

Output:
  List<MeditationSeat> seatList

Logic:
1. 重新排序新生(同伴优先):
   // 将同伴对移到数组前面
   reorderedNewStudents = []

   for companionGroup in companionGroups:
     for student in newLayStudents:
       if student in companionGroup:
         reorderedNewStudents.add(student)
         newLayStudents.remove(student)

   reorderedNewStudents.addAll(newLayStudents)  // 加入非同伴学员

2. 竖列分配 (从右到左):
   seatIndex = oldStudents.size() + 1
   currentCol = CHANCOLS - 1  // 从最右列开始
   currentRow = oldStudentRows + 1
   rowsInCurrentCol = 0

   for student in reorderedNewStudents:
     // 生成座位号
     seatNumber = generateSeatNumber(seatIndex, seatPrefix, numberingType)

     // 计算物理位置
     physicalRow = currentRow * 3 + 1
     physicalCol = currentCol * 4

     // 创建座位
     seat = new MeditationSeat(
       studentId = student.id,
       seatNumber = seatNumber,
       rowPosition = physicalRow,
       colPosition = physicalCol,
       seatType = "student",
       status = "allocated"
     )
     seatList.add(seat)

     // 下一行
     currentRow += 1
     rowsInCurrentCol += 1

     // 列满，移到左边列
     if currentRow > CHANROWS - 1:
       currentCol -= 1
       currentRow = oldStudentRows + 1
       rowsInCurrentCol = 0

     seatIndex++

3. 同伴座位标记:
   for companionGroup in companionGroups:
     seat1 = find(seatList, companionGroup[0])
     seat2 = find(seatList, companionGroup[1])

     seat1.companionSeatId = seat2.id
     seat2.companionSeatId = seat1.id
     seat1.isWithCompanion = true
     seat2.isWithCompanion = true

Output: seatList
```

---

## API设计

### API 1: 生成座位表
```
POST /api/meditation-seats/generate

Request:
{
  sessionId: 61,
  hallConfigIds: [1, 2],  // 可选
  overwrite: false,
  strategy: "auto"
}

Response: GenerateSeatsResponse
{
  success: true,
  message: "座位生成成功",
  totalStudents: 77,
  allocatedSeats: 77,
  failedAllocations: 0,
  seats: [
    {
      id: 1,
      seatNumber: "法1",
      studentId: 100,
      studentName: "释朗妙",
      studentAge: 35,
      seatType: "monk",
      status: "allocated"
    },
    ...
  ],
  warnings: [],
  errors: []
}

异常:
- 404: session not found
- 400: invalid parameters
- 409: seats already generated (use overwrite=true)
```

### API 2: 获取座位表
```
GET /api/meditation-seats?sessionId=61&regionCode=A

Response:
{
  success: true,
  seats: [
    {
      id: 1,
      seatNumber: "法1",
      studentId: 100,
      ...
    },
    ...
  ],
  summary: {
    totalSeats: 77,
    monks: 3,
    oldStudents: 25,
    newStudents: 49,
    unallocated: 0
  }
}
```

### API 3: 修改单个座位
```
PUT /api/meditation-seats/{id}

Request:
{
  studentId: 123,  // 可选，若修改分配学员
  seatNumber: "A5",  // 可选，若修改座位号
  notes: "靠近出口"
}

Response:
{
  id: 1,
  studentId: 123,
  seatNumber: "A5",
  status: "success"
}

验证:
- 检查座位是否存在
- 检查学员是否存在
- 检查学员性别与座位性别匹配
```

### API 4: 交换座位
```
POST /api/meditation-seats/swap

Request:
{
  seatId1: 10,
  seatId2: 15
}

Response:
{
  success: true,
  message: "座位交换成功",
  seat1: {
    id: 10,
    studentId: 456,
    seatNumber: "A10"
  },
  seat2: {
    id: 15,
    studentId: 789,
    seatNumber: "A15"
  }
}

验证:
- 两个座位必须同性别
- 不能交换法师座位与学员座位
```

### API 5: 批量调整座位
```
POST /api/meditation-seats/batch-adjust

Request:
{
  adjustments: [
    { seatId: 10, studentId: 456 },
    { seatId: 15, studentId: 789 },
    { seatId: 20, action: "clear" }  // 清空座位
  ]
}

Response:
{
  success: true,
  adjustedCount: 3,
  failedCount: 0,
  failures: []
}
```

### API 6: 生成座位表报表
```
GET /api/meditation-seats/report?sessionId=61&format=pdf

Query Parameters:
- format: pdf, excel, html (default: html)
- regionCode: A, B, etc. (optional, get all if not specified)
- includeStats: true/false

Response:
- 若format=pdf: Content-Type: application/pdf, 返回PDF文件
- 若format=excel: Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- 若format=html: Content-Type: text/html, 返回HTML报表
```

### API 7: 获取座位统计
```
GET /api/meditation-seats/statistics?sessionId=61

Response:
{
  sessionId: 61,
  totalStudents: 77,
  allocated: {
    monks: 3,
    oldLayStudents: 25,
    newLayStudents: 49
  },
  unallocated: 0,
  special: {
    companionPairs: 5,
    pregnantWomen: 1,
    elderlyOver60: 12
  },
  capacityUtilization: 0.9625,
  warnings: []
}
```

---

## 前端需求

### 页面 1: 座位生成和管理
```
URL: /meditation-seats

Components:
1. 顶部操作栏
   - 课程期次选择器
   - "生成座位表" 按钮
   - "保存" 按钮
   - "导出 PDF" 按钮
   - "导出 Excel" 按钮

2. 中部: 座位表编辑器
   - 交互式座位表网格
   - 点击座位显示学员信息
   - 支持拖拽交换座位
   - 支持搜索学员

3. 右侧: 学员列表面板
   - 未分配学员列表
   - 特殊标记学员 (孕妇、同伴等)

4. 底部: 统计和警告
   - 座位分配进度条
   - 警告消息展示
   - 错误消息展示

交互:
- 点击座位 → 显示/编辑学员信息
- 右键座位 → 清空、标记、交换菜单
- 拖拽学员到座位 → 分配/交换
- 搜索学员 → 高亮显示座位
```

### 页面 2: 座位表预览和报表
```
URL: /meditation-seats/report

Components:
1. 报表类型选择
   - 座位表 (表格)
   - 教师学员清单 (按座位号排序)
   - 统计报告 (人数、性别、年龄分布等)

2. 报表显示区域
   - 禅堂座位表 (可视化网格)
   - 学员清单 (表格)
   - 统计图表 (柱状图、饼图)

3. 导出选项
   - PDF 打印
   - Excel 编辑
   - 打印预览
```

### 页面 3: 座位调整
```
URL: /meditation-seats/adjust

功能:
1. 座位搜索和选择
   - 输入座位号查找
   - 输入学员名字查找

2. 单个座位编辑
   - 修改学员
   - 修改座位号
   - 修改备注

3. 批量操作
   - 座位交换
   - 座位清空
   - 学员重新分配
```

---

## 性能指标

### 性能要求
| 指标 | 要求 | 说明 |
|------|------|------|
| 座位生成时间 | < 2秒 | 最多200名学员 |
| 单座位修改 | < 100ms | 前端响应 |
| 座位交换 | < 200ms | 两个座位 |
| 报表生成 | < 3秒 | PDF/Excel |
| 并发请求 | 10+ RPS | API吞吐量 |
| 数据库查询 | < 50ms | 单个查询 |

### 优化策略
1. **座位生成**:
   - 批量插入数据库记录
   - 内存中完成所有计算
   - 最后一次性保存到数据库

2. **报表生成**:
   - 使用模板引擎缓存
   - 异步生成大文件报表
   - 使用分页处理长列表

3. **数据库**:
   - 座位查询加索引: (sessionId, seatNumber)
   - 学员查询加索引: (sessionId, studentId)
   - 批量操作使用事务

---

## 测试用例

### 测试 1: 基本座位生成 - 单一性别
**场景**: 女众课程, 49名新生 + 25名旧生 + 1名法师

**输入**:
```
sessionId: 61
gender: F
monks: 1
oldStudents: 25
newStudents: 49
totalStudents: 75
```

**预期输出**:
```
Monks:
  法1 (法师名)

Old Students (前2行, 左到右):
  旧1-旧8 (第1行)
  旧9-旧16 (第2行)
  旧17-旧25 (第3行)

New Students (竖列, 右到左):
  新1-新6 (最右列)
  新7-新12 (次右列)
  ...

座位数: 75/80 (示例)
分配率: 93.75%
警告: 无
```

### 测试 2: 同伴座位处理
**场景**: 5对夫妇同伴

**输入**:
```
totalStudents: 75 (含5对同伴)
companionPairs: 5 (10个学员)
```

**预期输出**:
```
- 同伴对聚集到禅堂右侧
- 两个座位行号或列号相邻
- 座位表中用相同颜色标记同伴对
- companionSeatId 互相指向
```

### 测试 3: 容量溢出处理
**场景**: 学员数超过禅堂容量

**输入**:
```
totalStudents: 100
hallCapacity: 80
isAutoRows: true
isAutoWidth: false
```

**预期输出**:
```
- 自动增加行数
- 新的布局: 8列 × 13行 (104容量)
- 警告: 无
- 所有100名学员成功分配
```

### 测试 4: 特殊学员处理
**场景**: 包含孕妇、同伴、60岁以上老年人

**输入**:
```
students: [
  { name: "张三", pregnant: true },
  { name: "李四", companion: "王五" },
  { name: "王五", companion: "李四" },
  { name: "赵六", age: 65 }
]
```

**预期输出**:
```
- 孕妇座位标记为红色
- 同伴座位相邻且同色
- 60岁老年人靠近出入口
- 座位表注释包含特殊信息
```

### 测试 5: 座位调整和交换
**场景**: 修改座位分配和交换学员

**操作**:
```
1. 修改座位: A5 学员变更 100 → 200
2. 交换座位: A5 ↔ B3
3. 批量调整: [A1→200, A2→clear, A3→201]
```

**预期结果**:
```
- 单个修改成功
- 座位交换验证学员性别匹配
- 批量操作原子性 (全成功或全失败)
- 数据库记录更新, 更新时间戳变化
```

### 测试 6: 报表生成
**场景**: 生成各种格式报表

**操作**:
```
1. GET /api/meditation-seats/report?format=pdf
2. GET /api/meditation-seats/report?format=excel
3. GET /api/meditation-seats/report?format=html
```

**预期结果**:
```
- PDF: 可打印的座位表
- Excel: 可编辑的表格
- HTML: 在线查看的页面
- 所有格式包含完整信息 (座位号、学员名、年龄、城市等)
```

### 测试 7: 性能测试 - 大规模数据
**场景**: 200名学员, 80个座位的禅堂

**操作**:
```
1. 生成座位表
2. 获取座位列表
3. 生成报表
4. 并发修改座位
```

**性能指标**:
```
- 座位生成: 2秒以内
- 列表查询: 100ms以内
- 报表生成: 3秒以内
- 单个修改: 100ms以内
- 10 RPS并发: 99%响应 < 500ms
```

---

## 数据库迁移脚本

### V4__create_meditation_seat_tables.sql
```sql
-- 禅堂配置表
CREATE TABLE meditation_hall_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  center_id BIGINT NOT NULL,
  region_code VARCHAR(10) NOT NULL,
  region_name VARCHAR(50),
  gender_type CHAR(1) NOT NULL DEFAULT 'M',  -- M, F, or X
  region_width INT DEFAULT 8,
  region_rows INT DEFAULT 10,
  is_auto_width BOOLEAN DEFAULT FALSE,
  is_auto_rows BOOLEAN DEFAULT TRUE,
  numbering_type VARCHAR(20) DEFAULT 'sequential',
  seat_prefix VARCHAR(10),
  monk_seats INT DEFAULT 0,
  monk_seat_prefix VARCHAR(10) DEFAULT '法',
  old_student_reserved_range VARCHAR(100),
  dharma_worker_area1 VARCHAR(100),
  dharma_worker_area2 VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_center_region (center_id, region_code),
  KEY idx_center_id (center_id),
  CONSTRAINT fk_meditation_hall_config_center
    FOREIGN KEY (center_id) REFERENCES center(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 禅堂座位表
CREATE TABLE meditation_seat (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT NOT NULL,
  center_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  hall_config_id BIGINT,
  region_code VARCHAR(10),
  seat_number VARCHAR(20) NOT NULL,
  row_position INT,
  col_position INT,
  seat_type VARCHAR(20) DEFAULT 'student',  -- student, monk, dharma_worker
  age_group VARCHAR(10),
  gender CHAR(1),
  is_with_companion BOOLEAN DEFAULT FALSE,
  companion_seat_id BIGINT,
  status VARCHAR(20) DEFAULT 'allocated',  -- available, allocated, reserved
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_session_seat (session_id, seat_number),
  KEY idx_session_student (session_id, student_id),
  KEY idx_session_region (session_id, region_code),
  KEY idx_companion (companion_seat_id),
  CONSTRAINT fk_meditation_seat_session
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE,
  CONSTRAINT fk_meditation_seat_student
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
  CONSTRAINT fk_meditation_seat_hall_config
    FOREIGN KEY (hall_config_id) REFERENCES meditation_hall_config(id) ON DELETE SET NULL,
  CONSTRAINT fk_meditation_seat_companion
    FOREIGN KEY (companion_seat_id) REFERENCES meditation_seat(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 总结

本PRD完整定义了禅堂座位分配系统的所有功能需求、业务规则、数据模型和实现细节。基于现有Excel VBA实现的成熟算法，确保系统的科学性和可靠性。

**关键实现点**:
1. ✅ 多优先级学员排序 (法师 > 旧生 > 新生)
2. ✅ 复杂的座位分配算法 (前排旧生 + 右侧竖列新生)
3. ✅ 同伴座位处理 (相邻和颜色标记)
4. ✅ 自动容量管理 (溢出检测和扩展)
5. ✅ 灵活的座位调整 (交换、修改、批量操作)
6. ✅ 完整的报表生成 (PDF/Excel/HTML)
7. ✅ 高性能实现 (< 2秒生成, < 100ms修改)

**下一步**: 基于本PRD实现后端API和前端UI。

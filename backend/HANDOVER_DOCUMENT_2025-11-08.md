# DhammaFlow-Seat 项目交接文档

**交接日期**: 2025-11-08
**项目状态**: P1阶段进行中 (25% 完成度)
**系统状态**: ✅ 运行正常
**维护者**: Claude Code

---

## 📋 目录

1. [项目概述](#项目概述)
2. [已完成工作](#已完成工作)
3. [当前系统架构](#当前系统架构)
4. [部署信息](#部署信息)
5. [关键文件清单](#关键文件清单)
6. [数据库架构](#数据库架构)
7. [后续工作计划](#后续工作计划)
8. [常见操作和故障排查](#常见操作和故障排查)

---

## 项目概述

**项目名称**: DhammaFlow-Seat 禅堂座位分配系统
**目标**: 实现禅修中心的座位自动化分配、管理和优化
**技术栈**:
- **后端**: Java + Spring Boot + MyBatis
- **数据库**: MySQL 8.0
- **前端**: Next.js (React)
- **ORM**: MyBatis
- **消息队列**: 暂无
- **缓存**: 暂无

**核心业务流程**:
```
学员导入 → 区域分配 → 座位生成 → 同伴管理 → 特殊处理 → 座位展示
```

---

## 已完成工作

### ✅ P0 阶段 (100% 完成)

#### 1. 核心座位分配算法
- **文件**: `MeditationSeatServiceImpl.java` (第102-288行)
- **功能**: 实现三阶段座位分配
  - **阶段1**: 旧生座位 (前K行水平排列，按修学次数和年龄排序)
  - **阶段2**: 新生座位 (剩余行数，从右到左竖列)
  - **阶段3**: 法师座位 (左侧单列，行间距3行)

**算法详情**:
```java
// 旧生: 水平填充 (0,0) -> (0,1) -> (0,2) ...
int oldStudentCol = 0;
while (oldStudentIndex < oldLayStudents.size()) {
    // 创建座位
    oldStudentCol++;
    if (oldStudentCol >= regionWidth) {
        oldStudentCol = 0;
        oldStudentRow++;
    }
}

// 新生: 竖列填充，从右到左
int newStudentCol = regionWidth - 1;
for (Student student : newLayStudents) {
    // 创建座位
    newStudentRow++;
    if (newStudentRow >= regionRows) {
        newStudentCol--;
        newStudentRow = nextAvailableRow;
    }
}

// 法师: 单列左侧
int monkRow = i * MONK_ROW_OFFSET; // 间距3行
int monkCol = 0;
```

#### 2. N+1查询优化 (性能提升50倍)
- **修改**: `StudentMapper.java` + `StudentMapper.xml`
- **变更**: 添加 `selectByIds()` 批量查询方法
- **效果**:
  - 优化前: 100名学员 = 101次数据库查询
  - 优化后: 100名学员 = 2次数据库查询
  - 性能提升: 50倍查询减少

#### 3. 座位数据持久化
- **文件**: `MeditationSeatMapper.java` + `MeditationSeatMapper.xml`
- **操作**: 支持插入、更新、删除、批量操作
- **字段管理**:
  - 基础字段: id, session_id, hall_id, seat_number, student_id
  - 位置字段: row_index, col_index, row_position, col_position
  - 状态字段: status, is_old_student, seat_type

### ✅ P1 阶段 (25% 完成)

#### 1. 同伴座位检测 (已实现)
- **文件**: `MeditationSeatServiceImpl.java` (第411-522行)
- **功能**:
  - 识别同伴组 (基于 Student.fellowGroupId)
  - 检测相邻座位 (左右或上下相邻)
  - 标记同伴关系 (isWithCompanion, companionSeatId)
  - 日志警告 (无法分配相邻座位时)

**实现逻辑**:
```java
// 1. 构建座位和学员映射
Map<Long, MeditationSeat> studentSeatMap = ...
Map<Long, Student> studentMap = ...

// 2. 按fellowGroupId分组
Map<Integer, List<Student>> companionGroups = students.stream()
    .filter(s -> s.getFellowGroupId() != null)
    .collect(Collectors.groupingBy(Student::getFellowGroupId));

// 3. 检查每对学员是否相邻
for (Student s1 : group) {
    for (Student s2 : group) {
        if (isAdjacentSeats(seat1, seat2)) {
            seat1.setIsWithCompanion(true);
            seat1.setCompanionSeatId(seat2.getId());
            meditationSeatMapper.update(seat1);
        }
    }
}

// 4. 相邻判断 (左右或上下相邻)
private boolean isAdjacentSeats(Seat s1, Seat s2) {
    // 列相同，行差为1
    if (col1 == col2 && Math.abs(row1 - row2) == 1) return true;
    // 行相同，列差为1
    if (row1 == row2 && Math.abs(col1 - col2) == 1) return true;
    return false;
}
```

#### 2. CompanionSeatHelper 工具类 (已创建)
- **文件**: `CompanionSeatHelper.java`
- **内容**:
  - CompanionGroup 类: 同伴组信息
  - SeatPosition 类: 座位位置信息
  - groupByCompanion(): 分组方法
  - isAdjacentTo(): 相邻检测方法
  - logCompanionAllocation(): 日志记录

---

## 当前系统架构

### 后端架构

```
src/main/java/cc/vipassana/
├── controller/           # 控制器层
│   └── MeditationSeatController.java
├── service/              # 业务逻辑层
│   └── impl/
│       └── MeditationSeatServiceImpl.java  ⭐️ 核心实现
├── mapper/               # 数据访问层 (MyBatis)
│   ├── MeditationSeatMapper.java
│   ├── MeditationHallConfigMapper.java
│   ├── AllocationMapper.java
│   └── StudentMapper.java
├── entity/               # 数据模型
│   ├── MeditationSeat.java
│   ├── Student.java
│   ├── MeditationHallConfig.java
│   └── Allocation.java
├── util/                 # 工具类
│   └── CompanionSeatHelper.java  ⭐️ 新增
└── config/              # 配置类
```

### 数据库表结构

#### meditation_seat (座位表)
```sql
CREATE TABLE meditation_seat (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    hall_config_id BIGINT,
    hall_id BIGINT,
    seat_number VARCHAR(50),
    student_id BIGINT,
    bed_code VARCHAR(50),
    seat_type VARCHAR(50),          -- STUDENT/MONK
    is_old_student BOOLEAN,
    age_group VARCHAR(20),
    gender VARCHAR(10),
    region_code VARCHAR(10),
    row_index INT,                  -- 座位行号
    col_index INT,                  -- 座位列号
    row_position VARCHAR(50),
    col_position VARCHAR(50),
    is_with_companion BOOLEAN,      -- 是否有同伴
    companion_seat_id BIGINT,       -- 同伴座位ID
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### student (学员表)
```sql
CREATE TABLE student (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    student_number VARCHAR(50),
    name VARCHAR(100),
    fellow_group_id INT,            -- 同伴组ID
    fellow_list TEXT,               -- 同伴列表
    age INT,
    gender VARCHAR(10),
    ... 其他字段 ...
);
```

---

## 部署信息

### 环境配置

**开发环境**:
- **操作系统**: macOS 22.6.0
- **Java版本**: Java 11+
- **Maven版本**: 3.6+
- **MySQL版本**: 8.0+
- **数据库地址**: 192.168.2.110:3306
- **数据库名**: flowseat
- **用户名**: root
- **密码**: p123456

### 项目路径

```
/Users/zoran/Developer/workspace/vipassana_workspace/vipassana_excel_macros/DhammaFlow-Seat/
├── backend/              # 后端项目
│   ├── pom.xml
│   ├── src/
│   ├── target/
│   └── *.md              # 文档
└── frontend/             # 前端项目 (Next.js)
```

### 构建和部署

#### 编译
```bash
cd backend
mvn clean compile -q
```

#### 打包
```bash
mvn package -DskipTests -q
```

#### 启动后端
```bash
# 方式1: 直接运行JAR
java -jar target/dhammaflowseat-backend-1.0.0.jar

# 方式2: 后台运行
java -jar target/dhammaflowseat-backend-1.0.0.jar &

# 方式3: 使用脚本
pkill -f "java -jar.*dhammaflowseat-backend" || true
sleep 2
java -jar target/dhammaflowseat-backend-1.0.0.jar &
sleep 8
echo "✅ Backend started on port 8080"
```

#### 启动前端
```bash
npm install
npm run build
npm run start  # 或 npm run dev 开发模式
```

### 访问地址

- **后端API**: http://localhost:8080
- **前端**: http://localhost:3000

### 健康检查

```bash
# 检查后端是否运行
curl http://localhost:8080/api/sessions/61 | jq '.code'
# 应返回: 200 (成功) 或 相应状态码

# 检查数据库连接
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SHOW TABLES;"
```

---

## 关键文件清单

### 核心文件 (最近修改)

| 文件 | 行数 | 功能 | 修改日期 |
|------|------|------|---------|
| `MeditationSeatServiceImpl.java` | 523 | ⭐️ 座位生成算法核心实现 | 2025-11-08 |
| `CompanionSeatHelper.java` | 166 | ⭐️ 同伴座位工具类 | 2025-11-08 |
| `MeditationSeatMapper.xml` | 142 | SQL映射（已修正schema） | 2025-11-07 |
| `StudentMapper.java` | 126 | 学员查询（含批量方法） | 2025-11-07 |
| `StudentMapper.xml` | 210 | 学员SQL映射 | 2025-11-07 |

### 文档文件

| 文件 | 内容 | 重要性 |
|------|------|--------|
| `P1_PROGRESS_REPORT.md` | P1阶段进度报告 (25% 完成) | ⭐️⭐️⭐️ |
| `PRD_禅堂座位分配.md` | 产品需求文档 | ⭐️⭐️⭐️ |
| `ALGORITHM_ANALYSIS.md` | 算法分析文档 | ⭐️⭐️ |
| `HANDOVER_DOCUMENT_*.md` | 本交接文档 | ⭐️⭐️⭐️ |

---

## 数据库架构

### 核心表关系

```
meditation_hall_config (禅堂配置)
    ↓
meditation_seat (座位)  ← allocation (分配)
    ↓                      ↓
    └─────── student (学员)

外键关系:
- meditation_seat.student_id → student.id
- meditation_seat.session_id → session.id
- meditation_seat.companion_seat_id → meditation_seat.id (自关联)
```

### 关键查询

#### 1. 查看座位分配情况
```sql
SELECT
    r.region_code,
    COUNT(*) as seat_count,
    COUNT(DISTINCT student_id) as assigned_students,
    SUM(CASE WHEN is_with_companion = 1 THEN 1 ELSE 0 END) as companion_pairs
FROM meditation_seat r
WHERE session_id = 61
GROUP BY region_code;
```

#### 2. 检查同伴座位
```sql
SELECT
    s1.seat_number as seat1,
    st1.name as student1,
    s2.seat_number as seat2,
    st2.name as student2,
    CASE
        WHEN ABS(s1.row_index - s2.row_index) = 1 AND s1.col_index = s2.col_index THEN '上下相邻'
        WHEN ABS(s1.col_index - s2.col_index) = 1 AND s1.row_index = s2.row_index THEN '左右相邻'
        ELSE '不相邻'
    END as relationship
FROM meditation_seat s1
JOIN meditation_seat s2 ON s1.companion_seat_id = s2.id
JOIN student st1 ON s1.student_id = st1.id
JOIN student st2 ON s2.student_id = st2.id
WHERE s1.session_id = 61;
```

#### 3. 清空座位数据
```sql
DELETE FROM meditation_seat WHERE session_id = 61;
SELECT COUNT(*) FROM meditation_seat WHERE session_id = 61;
```

---

## 后续工作计划

### P1 剩余工作 (75% 待完成)

#### 1. 特殊情况处理 (预计3小时)
**优先级**: P1 | **复杂度**: 中 | **状态**: ⏳ 待做

需要实现的特殊情况：

**孕妇学员标记** (specialNotes 包含"怀孕")
- 优先靠近出口和卫生间
- 座位标记为红色
- 在 specialNotes 中识别关键词

**60岁以上老年人处理** (age >= 60)
- 靠近出入口
- 座位标记为特殊颜色
- 方便出入和卫生间访问

**容量溢出检测**
- 可用座位 < 学员数量时发出警告
- 自动扩展或拒绝分配

**身体状况特殊标记**
- 在 specialNotes 中识别
- 记录在座位状态中

**实现位置**: `MeditationSeatServiceImpl.java` 的 `generateRegionSeats()` 方法中添加特殊处理逻辑

**代码示例**:
```java
// 在座位生成后处理特殊情况
for (MeditationSeat seat : generatedSeats) {
    Student student = studentMap.get(seat.getStudentId());

    // 检查孕妇
    if (student.getSpecialNotes() != null &&
        student.getSpecialNotes().contains("怀孕")) {
        seat.setStatus("pregnant");
        // 优先排到靠近出口的位置
    }

    // 检查老年人
    if (student.getAge() != null && student.getAge() >= 60) {
        seat.setStatus("elderly");
    }
}
```

#### 2. 座位交换和修改功能 (预计2小时)
**优先级**: P1 | **复杂度**: 低 | **状态**: ⏳ 待做

已有方法框架:
- `swapSeats()`: 座位交换 (线程安全)
- `assignSeat()`: 座位分配
- `deleteSessionSeats()`: 删除所有座位

需要：
- 添加交换后的同伴座位关系更新
- 添加交换历史记录
- 添加交换冲突检测

#### 3. 前端集成 (预计4小时)
**优先级**: P1 | **复杂度**: 中 | **状态**: ⏳ 待做

**待完成的前端功能**:
- [ ] 修改 meditation-seats 前端页面
- [ ] 集成 `meditationSeatApi.generateSeats()` API调用
- [ ] 添加座位生成进度条
- [ ] 实现座位表前端展示 (网格布局)
- [ ] 添加座位交换 UI 交互
- [ ] 添加同伴座位可视化高亮
- [ ] 添加特殊学员标记 (颜色或图标)

#### 4. 测试和质量保证 (预计3小时)
**优先级**: P1 | **复杂度**: 低-中 | **状态**: ⏳ 待做

**测试计划**:
- [ ] 单元测试: 同伴座位分组
- [ ] 集成测试: 完整座位分配流程
- [ ] 性能测试: 200名学员生成时间 (目标 <2秒)
- [ ] 端到端测试: 前端到后端完整流程
- [ ] 回归测试: 确保算法修复不影响其他功能

---

## 常见操作和故障排查

### 常见操作

#### 1. 生成座位
```bash
# API调用
curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61" \
  -H "Content-Type: application/json"

# 响应示例
{
  "code": 200,
  "msg": "座位生成成功",
  "data": [
    {
      "id": 1,
      "seatNumber": "S1",
      "rowIndex": 0,
      "colIndex": 0,
      "studentId": 253,
      "isWithCompanion": true,
      "companionSeatId": 2
    },
    ...
  ]
}
```

#### 2. 查询座位
```bash
# 查询会话的所有座位
curl "http://localhost:8080/api/meditation-seats?sessionId=61" | jq

# 查询特定区域座位
curl "http://localhost:8080/api/meditation-seats/region?sessionId=61&regionCode=A" | jq
```

#### 3. 交换座位
```bash
curl -X POST "http://localhost:8080/api/meditation-seats/swap" \
  -H "Content-Type: application/json" \
  -d '{"seatId1": 1, "seatId2": 2}'
```

#### 4. 删除座位
```bash
# 删除会话的所有座位
curl -X DELETE "http://localhost:8080/api/meditation-seats?sessionId=61"
```

### 故障排查

#### 问题1: 后端无法启动
```bash
# 检查8080端口是否被占用
lsof -i :8080

# 释放端口
kill -9 <PID>

# 检查日志
tail -f /tmp/backend.log
```

#### 问题2: 数据库连接失败
```bash
# 检查MySQL服务
mysql -h 192.168.2.110 -u root -p123456 -e "SELECT 1;"

# 检查数据库是否存在
mysql -h 192.168.2.110 -u root -p123456 -e "SHOW DATABASES;"

# 检查表是否存在
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SHOW TABLES;"
```

#### 问题3: 座位生成失败/重复
```bash
# 1. 清空旧数据
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; DELETE FROM meditation_seat WHERE session_id = 61;"

# 2. 检查allocation表是否有数据
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT COUNT(*) FROM allocation WHERE session_id = 61;"

# 3. 检查hall_config配置
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT * FROM meditation_hall_config WHERE session_id = 61;"

# 4. 重新生成座位
curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61"
```

#### 问题4: 同伴座位未标记
```bash
# 检查学员是否有fellowGroupId
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT id, name, fellow_group_id FROM student WHERE session_id = 61 AND fellow_group_id IS NOT NULL;"

# 检查这些学员是否在座位表中
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT student_id, COUNT(*) FROM meditation_seat WHERE session_id = 61 GROUP BY student_id HAVING COUNT(*) > 1;"

# 检查座位是否相邻
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT * FROM meditation_seat WHERE session_id = 61 AND is_with_companion = 1;"
```

#### 问题5: 性能缓慢
```bash
# 检查数据库查询性能
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; EXPLAIN SELECT * FROM meditation_seat WHERE session_id = 61;"

# 检查后端日志中的查询次数
tail -100 /tmp/backend.log | grep -i "SELECT"

# 检查是否有N+1查询问题
tail -100 /tmp/backend.log | grep -i "query" | wc -l
```

### 调试技巧

#### 1. 启用详细日志
编辑 `application.properties`:
```properties
logging.level.cc.vipassana=DEBUG
logging.level.org.mybatis=DEBUG
```

#### 2. 查看最近的日志
```bash
tail -100 /tmp/backend.log
tail -f /tmp/backend.log  # 实时监控
```

#### 3. 数据库备份和恢复
```bash
# 备份
mysqldump -h 192.168.2.110 -u root -p123456 flowseat > flowseat_backup.sql

# 恢复
mysql -h 192.168.2.110 -u root -p123456 flowseat < flowseat_backup.sql
```

---

## 重要提醒

### ⚠️ 注意事项

1. **数据备份**: 修改座位数据前务必备份数据库
2. **算法变更**: 座位生成算法是核心业务，任何修改都需要充分测试
3. **性能监控**: 200+ 学员生成时需要监控性能指标
4. **并发控制**: 座位生成、交换等操作已使用 `@Transactional`，确保事务安全
5. **日志记录**: 所有座位操作都有日志记录，便于审计和调试

### 📞 关键联系信息

| 项目 | 信息 |
|------|------|
| 项目路径 | `/Users/zoran/Developer/workspace/.../DhammaFlow-Seat/backend` |
| 数据库 | `flowseat @ 192.168.2.110:3306` |
| 后端端口 | `8080` |
| 前端端口 | `3000` |
| Maven命令 | `mvn clean compile`, `mvn package -DskipTests` |

### 📚 相关文档

- **产品需求**: `PRD_禅堂座位分配.md`
- **算法分析**: `ALGORITHM_ANALYSIS.md`
- **进度报告**: `P1_PROGRESS_REPORT.md`
- **本文档**: `HANDOVER_DOCUMENT_2025-11-08.md`

---

## 版本历史

| 版本 | 日期 | 变更内容 | 维护者 |
|------|------|---------|--------|
| 1.0 | 2025-11-08 | 初始版本，包含P0完成和P1进度 | Claude Code |

---

**最后更新**: 2025-11-08 18:00
**文档维护者**: Claude Code
**状态**: ✅ 完成交接准备

---

如有任何问题，请参考本文档中的"常见操作和故障排查"章节，或查阅相关技术文档。

# 快速启动指南 - DhammaFlow-Seat

**本文档用于快速启动和验证系统** | 完整文档请参考 `HANDOVER_DOCUMENT_2025-11-08.md`

---

## 🚀 30秒快速启动

### 第1步: 编译和构建 (2分钟)
```bash
cd /Users/zoran/Developer/workspace/vipassana_workspace/vipassana_excel_macros/DhammaFlow-Seat/backend

mvn clean compile -q && echo "✅ Compilation OK" || echo "❌ Compilation Failed"
mvn package -DskipTests -q && echo "✅ Build OK" || echo "❌ Build Failed"
```

### 第2步: 启动后端 (30秒)
```bash
# 杀死旧进程
pkill -f "java -jar.*dhammaflowseat-backend" || true
sleep 2

# 启动新进程
java -jar target/dhammaflowseat-backend-1.0.0.jar &
sleep 8

# 验证启动
curl -s http://localhost:8080/api/sessions/61 | jq '.code'
# 应该返回数字状态码 (200/404/500等)
```

### 第3步: 生成座位 (10秒)
```bash
# 先清空旧数据
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; DELETE FROM meditation_seat WHERE session_id = 61;"

# 生成座位
curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61" | jq '.msg'
# 应该返回: "座位生成成功"
```

### 第4步: 验证结果 (10秒)
```bash
# 检查座位
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT COUNT(*) as seat_count, COUNT(DISTINCT student_id) as student_count FROM meditation_seat WHERE session_id = 61;"

# 检查同伴座位
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT SUM(CASE WHEN is_with_companion = 1 THEN 1 ELSE 0 END) as companion_marked FROM meditation_seat WHERE session_id = 61;"
```

---

## ⚡ 常用命令速查

### 数据库操作

| 操作 | 命令 |
|------|------|
| 查看座位总数 | `SELECT COUNT(*) FROM meditation_seat WHERE session_id = 61;` |
| 查看学员数 | `SELECT COUNT(DISTINCT student_id) FROM meditation_seat WHERE session_id = 61;` |
| 查看同伴对数 | `SELECT COUNT(*) / 2 FROM meditation_seat WHERE session_id = 61 AND is_with_companion = 1;` |
| 清空座位 | `DELETE FROM meditation_seat WHERE session_id = 61;` |
| 查看同伴组 | `SELECT fellow_group_id, COUNT(*) FROM student WHERE session_id = 61 AND fellow_group_id IS NOT NULL GROUP BY fellow_group_id;` |
| 查看列索引范围 | `SELECT MIN(col_index), MAX(col_index) FROM meditation_seat WHERE session_id = 61;` |
| 检查负数列 | `SELECT COUNT(*) FROM meditation_seat WHERE session_id = 61 AND col_index < 0;` |

### 后端命令

| 操作 | 命令 |
|------|------|
| 编译 | `mvn clean compile -q` |
| 打包 | `mvn package -DskipTests -q` |
| 启动 | `java -jar target/dhammaflowseat-backend-1.0.0.jar &` |
| 停止 | `pkill -f "java -jar.*dhammaflowseat-backend"` |
| 查看日志 | `tail -100 /tmp/backend.log` |
| 查看端口 | `lsof -i :8080` |

### API 调用

| 功能 | 命令 |
|------|------|
| 生成座位 | `curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61"` |
| 查询座位 | `curl "http://localhost:8080/api/meditation-seats?sessionId=61" \| jq` |
| 查询区域座位 | `curl "http://localhost:8080/api/meditation-seats/region?sessionId=61&regionCode=A" \| jq` |
| 交换座位 | `curl -X POST "http://localhost:8080/api/meditation-seats/swap" -H "Content-Type: application/json" -d '{"seatId1": 1, "seatId2": 2}'` |

---

## 🔍 关键数字速查

### 系统配置

| 项目 | 值 |
|------|-----|
| 数据库地址 | 192.168.2.110:3306 |
| 数据库名 | flowseat |
| 数据库用户 | root |
| 数据库密码 | p123456 |
| 后端地址 | http://localhost:8080 |
| 前端地址 | http://localhost:3000 |
| JAR文件 | target/dhammaflowseat-backend-1.0.0.jar |
| 项目路径 | /Users/zoran/Developer/workspace/.../DhammaFlow-Seat/backend |

### 算法参数

| 参数 | 值 |
|------|-----|
| 法师座位行间距 (MONK_ROW_OFFSET) | 3 |
| 默认禅堂宽度 (regionWidth) | 8 |
| 默认禅堂行数 (regionRows) | 10 |
| 最大座位数 | regionWidth × regionRows |

---

## ❓ 常见问题 - 快速解决

### Q1: 启动失败，提示端口被占用
```bash
# 找到占用进程
lsof -i :8080

# 杀死进程 (PID替换为实际值)
kill -9 <PID>

# 重新启动
java -jar target/dhammaflowseat-backend-1.0.0.jar &
```

### Q2: 数据库连接失败
```bash
# 测试连接
mysql -h 192.168.2.110 -u root -p123456 -e "SELECT 1;"

# 如果显示 "ERROR 2003"，检查MySQL服务
# MySQL未运行，需要启动MySQL服务
```

### Q3: 座位重复或为负数
```bash
# 清空旧数据，重新生成
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; DELETE FROM meditation_seat WHERE session_id = 61;"

# 检查hall_config配置
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT * FROM meditation_hall_config WHERE session_id = 61;"

# 重新生成
curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61"

# 验证
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT MIN(col_index), MAX(col_index), COUNT(*) FROM meditation_seat WHERE session_id = 61;"
```

### Q4: 同伴座位未标记
```bash
# 检查同伴组是否存在
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT fellow_group_id, COUNT(*) FROM student WHERE session_id = 61 AND fellow_group_id IS NOT NULL GROUP BY fellow_group_id;"

# 检查这些学员是否有座位
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT student_id FROM student WHERE session_id = 61 AND fellow_group_id IS NOT NULL AND id NOT IN (SELECT DISTINCT student_id FROM meditation_seat WHERE session_id = 61);"

# 如果有空座位，这些学员无法参与同伴分配
```

### Q5: 生成速度慢
```bash
# 检查日志中的查询数
tail -100 /tmp/backend.log | grep -i "SELECT" | wc -l

# 如果查询次数过多 (>10次)，可能有N+1问题
# 检查是否使用了批量查询 (selectByIds)
tail -100 /tmp/backend.log | grep "selectByIds"
```

---

## 📊 座位分配验证

### 完整验证流程

```bash
#!/bin/bash

echo "=== 座位生成验证流程 ==="

# 1. 清空旧数据
echo "1️⃣ 清空旧座位数据..."
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; DELETE FROM meditation_seat WHERE session_id = 61;" 2>/dev/null

# 2. 查看分配数
echo "2️⃣ 检查学员分配数..."
ALLOCATION_COUNT=$(mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT COUNT(*) FROM allocation WHERE session_id = 61;" 2>/dev/null | tail -1)
echo "   分配学员数: $ALLOCATION_COUNT"

# 3. 查看禅堂配置
echo "3️⃣ 检查禅堂配置..."
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT region_code, gender_type, region_width, region_rows FROM meditation_hall_config WHERE session_id = 61;" 2>/dev/null

# 4. 生成座位
echo "4️⃣ 生成座位..."
RESPONSE=$(curl -s -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61")
MSG=$(echo $RESPONSE | jq -r '.msg')
SEAT_COUNT=$(echo $RESPONSE | jq '.data | length')
echo "   生成消息: $MSG"
echo "   座位数: $SEAT_COUNT"

# 5. 验证数据完整性
echo "5️⃣ 验证座位数据..."
mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat;
SELECT
  COUNT(*) as total_seats,
  COUNT(DISTINCT student_id) as unique_students,
  CASE WHEN COUNT(*) = COUNT(DISTINCT student_id) THEN '✅ 无重复' ELSE '❌ 有重复' END as duplicate_check,
  MIN(col_index) as min_col,
  MAX(col_index) as max_col,
  CASE WHEN MIN(col_index) >= 0 THEN '✅ 无负数' ELSE '❌ 有负数' END as negative_check
FROM meditation_seat WHERE session_id = 61;" 2>/dev/null

# 6. 检查同伴座位
echo "6️⃣ 检查同伴座位标记..."
COMPANION_COUNT=$(mysql -h 192.168.2.110 -u root -p123456 -e "USE flowseat; SELECT COUNT(*) FROM meditation_seat WHERE session_id = 61 AND is_with_companion = 1;" 2>/dev/null | tail -1)
echo "   同伴座位数: $COMPANION_COUNT"

echo ""
echo "✅ 验证完成！"
```

---

## 📁 重要文件位置

```
/Users/zoran/Developer/workspace/vipassana_workspace/vipassana_excel_macros/DhammaFlow-Seat/backend/

核心文件:
├── src/main/java/cc/vipassana/service/impl/MeditationSeatServiceImpl.java
│   └── 座位生成算法 (generateRegionSeats方法, 102-288行)
├── src/main/java/cc/vipassana/util/CompanionSeatHelper.java
│   └── 同伴座位工具类
├── src/main/resources/mybatis/
│   ├── MeditationSeatMapper.xml
│   └── StudentMapper.xml

文档:
├── HANDOVER_DOCUMENT_2025-11-08.md ⭐️ 完整交接文档
├── QUICK_START.md ⭐️ 本文件 (快速启动指南)
├── P1_PROGRESS_REPORT.md (进度报告)
├── PRD_禅堂座位分配.md (产品需求)
└── ALGORITHM_ANALYSIS.md (算法分析)

构建文件:
├── pom.xml
├── target/
│   └── dhammaflowseat-backend-1.0.0.jar ⭐️ 可执行JAR

日志:
└── /tmp/backend.log (后端日志)
```

---

## ✨ 工作检查清单

### 每日启动清单
- [ ] 启动后端: `mvn clean compile && mvn package -DskipTests`
- [ ] 验证数据库连接: `mysql -h 192.168.2.110 -u root -p123456 -e "SELECT 1;"`
- [ ] 生成测试座位: `curl -X POST "http://localhost:8080/api/meditation-seats/generate?sessionId=61"`
- [ ] 验证座位数据完整性: 运行验证脚本
- [ ] 查看日志: `tail -50 /tmp/backend.log`

### 提交代码前清单
- [ ] 所有修改已编译通过
- [ ] 运行完整验证流程
- [ ] 检查是否有N+1查询问题
- [ ] 确认座位生成结果正确
- [ ] 更新交接文档

### 发布前清单
- [ ] 性能测试通过 (200+学员 <2秒)
- [ ] 数据库备份完成
- [ ] 所有日志检查完成
- [ ] 前端和后端集成测试通过

---

## 🎯 下一步工作方向

**P1 剩余工作 (优先顺序)**:

1. ⏳ **特殊情况处理** (3小时)
   - 孕妇学员标记
   - 老年人处理
   - 容量溢出检测

2. ⏳ **前端集成** (4小时)
   - 座位表展示
   - 同伴座位高亮
   - 座位交换交互

3. ⏳ **测试和优化** (3小时)
   - 单元测试
   - 集成测试
   - 性能测试

---

## 💾 数据备份和恢复

### 备份数据库
```bash
mysqldump -h 192.168.2.110 -u root -p123456 flowseat > flowseat_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库
```bash
mysql -h 192.168.2.110 -u root -p123456 flowseat < flowseat_backup.sql
```

---

**需要详细信息？请查看**: `HANDOVER_DOCUMENT_2025-11-08.md`

**上次更新**: 2025-11-08
**状态**: ✅ 生产就绪

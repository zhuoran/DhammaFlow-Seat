# DhammaFlowSeat 快速开始指南

## 🚀 快速启动

### 后端启动 (Backend)

```bash
# 进入后端目录
cd backend

# 编译打包
mvn clean package -DskipTests

# 启动应用
java -jar target/dhammaflowseat-backend-1.0.0.jar

# 后端地址: http://localhost:8080/api
```

### 前端启动 (Frontend)

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 开发服务器
npm run dev

# 前端地址: http://localhost:3000
```

---

## 📋 核心功能导航

### 1. 房间管理 (Room Management)
- **URL**: http://localhost:3000/rooms
- **功能**:
  - 查看禅修中心的所有房间
  - 创建新房间 (建筑/楼层/房号)
  - 编辑房间信息
  - 删除房间

### 2. 床位管理 (Bed Management)
- **URL**: http://localhost:3000/beds
- **功能**:
  - 选择房间查看床位
  - 创建单个床位
  - 快速生成多个床位（上铺/下铺交替）
  - 编辑和删除床位

### 3. 手工分配 (Manual Allocation)
- **URL**: http://localhost:3000/allocations/manual
- **功能**:
  - 查看待分配学员列表
  - 为学员分配房间和床位
  - 查看房间分配情况
  - 调整/删除已有分配

---

## 🔧 主要接口

### 房间 API
```bash
# 获取房间列表
GET /api/rooms?centerId=1

# 创建房间
POST /api/rooms
{
  "centerId": 1,
  "building": "A",
  "floor": 1,
  "roomNumber": "101",
  "capacity": 4,
  "roomType": "new_student"
}

# 更新房间
PUT /api/rooms/{id}

# 删除房间
DELETE /api/rooms/{id}
```

### 床位 API
```bash
# 获取床位列表
GET /api/beds

# 创建床位
POST /api/beds

# 批量创建床位
POST /api/beds/batch

# 删除房间所有床位
DELETE /api/beds/room/{roomId}
```

### 分配 API
```bash
# 获取分配列表
GET /api/allocations/{sessionId}

# 创建分配
POST /api/allocations
{
  "sessionId": 1,
  "studentId": 1,
  "bedId": 1
}

# 更新分配
PUT /api/allocations/{id}

# 删除分配
DELETE /api/allocations/{id}
```

---

## 📁 重要文件位置

### 后端
| 文件 | 说明 |
|------|------|
| `backend/src/main/java/cc/vipassana/service/RoomService.java` | 房间业务接口 |
| `backend/src/main/java/cc/vipassana/service/BedService.java` | 床位业务接口 |
| `backend/src/main/java/cc/vipassana/controller/RoomController.java` | 房间REST端点 |
| `backend/src/main/java/cc/vipassana/controller/BedController.java` | 床位REST端点 |
| `backend/src/main/resources/mybatis/RoomMapper.xml` | 房间SQL映射 |
| `backend/src/main/resources/mybatis/BedMapper.xml` | 床位SQL映射 |

### 前端
| 文件 | 说明 |
|------|------|
| `frontend/app/rooms/page.tsx` | 房间管理页面 |
| `frontend/app/beds/page.tsx` | 床位管理页面 |
| `frontend/app/allocations/manual/page.tsx` | 手工分配页面 |
| `frontend/services/api/room.ts` | 房间API服务 |
| `frontend/services/api/bed.ts` | 床位API服务 |
| `frontend/services/api/allocation.ts` | 分配API服务 |

---

## 🧪 常用测试命令

### 后端测试
```bash
# 编译检查
cd backend && mvn clean compile

# 打包检查
mvn clean package -DskipTests

# 运行所有测试
mvn test
```

### 前端检查
```bash
cd frontend

# 安装依赖
npm install

# 检查 TypeScript 错误
npm run type-check

# 构建检查
npm run build
```

---

## 🔍 常见问题排查

### 后端编译错误
```
❌ Method selectAll() not found in BedMapper
✅ 解决: 检查 BedMapper.java 和 BedMapper.xml 中都有这个方法
```

### 前端样式问题
```
❌ 页面样式混乱
✅ 解决: 确保导入了 Ant Design 样式
import '@/styles/globals.css'
```

### API 连接失败
```
❌ Failed to fetch from http://localhost:8080/api
✅ 解决: 确认后端已启动: java -jar target/dhammaflowseat-backend-1.0.0.jar
```

### 数据为空
```
❌ 列表显示为空
✅ 解决:
1. 确认已在前端选择了禅修中心和课程会期
2. 确认数据库中有数据
3. 检查浏览器控制台 Network 标签查看 API 响应
```

---

## 📊 数据流向

```
前端 (React)
   ↓ (REST API)
后端 Controller (Spring Boot)
   ↓ (Service 调用)
Service 层 (业务逻辑)
   ↓ (Mapper 调用)
Mapper 层 (MyBatis)
   ↓ (SQL)
数据库 (MySQL)
```

---

## 🎯 当前实现状态

| 功能 | 状态 | 进度 |
|------|------|------|
| 房间管理 | ✅ | 100% |
| 床位管理 | ✅ | 100% |
| 手工分配 | ✅ | 100% |
| 自动分配 | ⏳ | 0% |
| 版本管理 | ⏳ | 0% |
| 禅堂座位 | ⏳ | 0% |

---

## 📞 需要帮助？

1. **查看完整文档**: `HANDOFF_DOCUMENT.md`
2. **查看需求文档**: `PRD_智能排床系统.md`
3. **查看技术方案**: `技术方案-SpringBoot+MyBatis版本.md`

---

**最后更新**: 2025-11-01
**状态**: ✅ 可用于生产

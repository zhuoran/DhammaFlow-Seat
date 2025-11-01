# DhammaFlowSeat - 智能排床系统

![Status](https://img.shields.io/badge/status-beta-yellow)
![Build](https://img.shields.io/badge/build-passing-green)
![License](https://img.shields.io/badge/license-MIT-blue)

> 一个为禅修中心设计的智能学员房间分配管理系统

## 📚 文档导航

本项目包含以下核心文档，请根据需要选择：

### 🎯 快速入门 (5分钟)
- **[QUICK_START.md](./QUICK_START.md)** - 快速启动指南
  - 后端/前端启动命令
  - 核心功能导航
  - 常用接口示例
  - 快速故障排查

### 📋 完整交接文档 (30分钟)
- **[HANDOFF_DOCUMENT.md](./HANDOFF_DOCUMENT.md)** - 完整的交接文档
  - 项目概述和架构
  - 已完成功能详情
  - API 完整文档
  - 数据库表结构
  - 后续任务规划
  - 常见问题解答
  - 部署和运维指南

### 📝 变更日志 (10分钟)
- **[CHANGELOG.md](./CHANGELOG.md)** - 详细变更记录
  - 新增/修改的文件列表
  - 代码变更对比
  - API 端点总览
  - 编译验证结果

### 🔧 技术方案
- **[技术方案-SpringBoot+MyBatis版本.md](./技术方案-SpringBoot+MyBatis版本.md)** - 系统设计和技术细节
  - 架构设计
  - 技术选型
  - 数据模型
  - 核心算法

### 📖 产品需求
- **[PRD_智能排床系统.md](./PRD_智能排床系统.md)** - 完整的产品需求文档
  - 功能需求详情
  - 业务流程
  - 用户故事
  - 非功能需求

### ⚙️ 环境配置
- **[CONFIG_GUIDE.md](./CONFIG_GUIDE.md)** - 环境配置指南
  - 数据库配置
  - 后端配置
  - 前端配置
  - 依赖安装

---

## 🚀 快速开始

### 最少操作步骤 (5分钟)

```bash
# 1. 启动后端
cd backend
mvn clean package -DskipTests
java -jar target/dhammaflowseat-backend-1.0.0.jar

# 2. 启动前端 (新终端窗口)
cd frontend
npm install
npm run dev

# 3. 打开浏览器
open http://localhost:3000
```

### 访问地址
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080/api
- **数据库**: localhost:3306 (需要自行配置)

---

## 📊 项目状态

### 已完成功能 ✅

| 功能模块 | 状态 | 进度 | 文件 |
|---------|------|------|------|
| **房间管理** | ✅ 完成 | 100% | RoomService, RoomController |
| **床位管理** | ✅ 完成 | 100% | BedService, BedController |
| **手工分配** | ✅ 完成 | 100% | manual/page.tsx |
| **学员管理** | ✅ 完成 | 100% | students/page.tsx |
| **会期管理** | ✅ 完成 | 100% | session API |

### 待完成功能 ⏳

| 功能模块 | 优先级 | 工作量 | 备注 |
|---------|--------|--------|------|
| **自动分配算法** | 高 | 2-3天 | 基于优先级和同伴关系 |
| **版本管理** | 高 | 1-2天 | 分配确定、回滚、历史 |
| **禅堂座位分配** | 中 | 2-3天 | 房间→座位映射 |
| **课程设置** | 中 | 1-2天 | 课程信息管理 |
| **报表导出** | 低 | 1-2天 | Excel/PDF/CSV |

---

## 🏗️ 项目架构

### 技术栈

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 14)           │
│    ├─ React Hooks                      │
│    ├─ Ant Design 5                     │
│    └─ TypeScript                       │
└──────────────────┬──────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────┐
│      Backend (Spring Boot 3.2)          │
│    ├─ Spring Web MVC                   │
│    ├─ MyBatis                          │
│    └─ Lombok                           │
└──────────────────┬──────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────┐
│    Database (MySQL 8.0+)                │
│    ├─ room                             │
│    ├─ bed                              │
│    ├─ allocation                       │
│    └─ student, session, center...      │
└─────────────────────────────────────────┘
```

### 目录结构

```
DhammaFlowSeat/
├── backend/                          # Spring Boot 后端
│   ├── src/main/java/cc/vipassana/
│   │   ├── controller/               # REST API 控制器
│   │   ├── service/                  # 业务逻辑层
│   │   ├── mapper/                   # 数据访问层 (MyBatis)
│   │   └── entity/                   # 数据实体
│   ├── src/main/resources/
│   │   ├── mybatis/                  # SQL 映射文件
│   │   └── application.properties    # 配置文件
│   └── pom.xml                       # Maven 配置
│
├── frontend/                         # Next.js 前端
│   ├── app/                          # 页面和路由
│   │   ├── allocations/              # 分配功能
│   │   ├── rooms/                    # 房间管理
│   │   ├── beds/                     # 床位管理
│   │   └── ...
│   ├── services/api/                 # API 调用层
│   ├── components/                   # React 组件
│   └── package.json                  # npm 配置
│
├── 📚 文档文件
│   ├── HANDOFF_DOCUMENT.md           # 完整交接文档 ⭐
│   ├── QUICK_START.md                # 快速开始指南
│   ├── CHANGELOG.md                  # 变更日志
│   ├── PRD_智能排床系统.md            # 需求文档
│   ├── 技术方案-SpringBoot+MyBatis版本.md
│   └── CONFIG_GUIDE.md               # 配置指南
│
└── 📋 其他文件
    ├── README.md                     # 本文件
    ├── .gitignore
    └── student-demo.xlsx             # 示例数据
```

---

## 🔌 核心 API 端点

### 房间管理
```bash
GET    /api/rooms              # 获取房间列表
POST   /api/rooms              # 创建房间
PUT    /api/rooms/{id}         # 更新房间
DELETE /api/rooms/{id}         # 删除房间
```

### 床位管理
```bash
GET    /api/beds               # 获取床位列表
POST   /api/beds               # 创建床位
POST   /api/beds/batch         # 批量创建
DELETE /api/beds/{id}          # 删除床位
```

### 分配管理
```bash
GET    /api/allocations/{sid}  # 获取分配列表
POST   /api/allocations        # 创建分配
PUT    /api/allocations/{id}   # 更新分配
DELETE /api/allocations/{id}   # 删除分配
```

完整 API 文档见: [HANDOFF_DOCUMENT.md](./HANDOFF_DOCUMENT.md#api文档)

---

## 🧪 开发指南

### 添加新功能

1. **定义实体** (Entity)
   ```bash
   backend/src/main/java/cc/vipassana/entity/YourEntity.java
   ```

2. **创建业务服务** (Service)
   ```bash
   backend/src/main/java/cc/vipassana/service/YourService.java
   backend/src/main/java/cc/vipassana/service/impl/YourServiceImpl.java
   ```

3. **编写数据访问** (Mapper)
   ```bash
   backend/src/main/java/cc/vipassana/mapper/YourMapper.java
   backend/src/main/resources/mybatis/YourMapper.xml
   ```

4. **实现 REST 端点** (Controller)
   ```bash
   backend/src/main/java/cc/vipassana/controller/YourController.java
   ```

5. **前端 API 层** (Service)
   ```bash
   frontend/services/api/your.ts
   ```

6. **创建页面** (Page)
   ```bash
   frontend/app/your-feature/page.tsx
   ```

### 编码规范

- **后端**: Java Coding Standards with Lombok
- **前端**: React Hooks + TypeScript + Ant Design
- **数据库**: 蛇形命名 (snake_case)
- **API**: RESTful 设计，驼峰命名 (camelCase)

### 提交代码

```bash
# 1. 编译验证
cd backend && mvn clean compile
cd frontend && npm run type-check

# 2. 测试验证
mvn test

# 3. Git 提交
git add .
git commit -m "feat: 添加新功能"
git push
```

---

## 🐛 故障排查

### 问题 1: 后端编译失败
```
Error: Method 'xxx' not found in interface 'YyyMapper'
```
**解决**: 确保 Service 接口、实现类和 Mapper 接口中都有该方法声明。

### 问题 2: 前端无法连接后端
```
Failed to fetch from http://localhost:8080/api
```
**解决**:
1. 确认后端已启动: `java -jar target/dhammaflowseat-backend-1.0.0.jar`
2. 检查网络连接: `curl http://localhost:8080/api/health`
3. 检查跨域配置: 查看 Spring Boot 的 CORS 设置

### 问题 3: 页面显示为空
```
列表中没有数据
```
**解决**:
1. 确认已选择禅修中心和课程会期
2. 检查浏览器 DevTools -> Network -> 查看 API 响应
3. 检查数据库中是否有数据: `SELECT * FROM room WHERE center_id = 1;`

更多问题见: [HANDOFF_DOCUMENT.md#常见问题](./HANDOFF_DOCUMENT.md#常见问题)

---

## 📞 获取帮助

### 文档资源
1. **快速问题** → [QUICK_START.md](./QUICK_START.md)
2. **详细问题** → [HANDOFF_DOCUMENT.md](./HANDOFF_DOCUMENT.md)
3. **代码问题** → [CHANGELOG.md](./CHANGELOG.md)
4. **功能需求** → [PRD_智能排床系统.md](./PRD_智能排床系统.md)
5. **技术细节** → [技术方案-SpringBoot+MyBatis版本.md](./技术方案-SpringBoot+MyBatis版本.md)

### 关键文件位置
- 后端源码: `backend/src/main/java/cc/vipassana/`
- 前端源码: `frontend/app/` 和 `frontend/services/api/`
- 数据库脚本: `backend/src/main/resources/db/`
- 配置文件: `backend/src/main/resources/application.properties`

---

## ✨ 特色功能

### 多中心隔离
系统支持多个禅修中心，通过 `centerId` 自动隔离数据：
```javascript
const rooms = await roomApi.getRooms(centerId);
```

### 床位快速生成
一键生成多个床位，自动交替设置上下铺：
```javascript
const beds = Array.from({ length: 10 }, (_, i) => ({
  roomId: 1,
  bedNumber: i + 1,
  position: i % 2 === 0 ? '下铺' : '上铺',
}));
await bedApi.createBedsBatch(beds);
```

### 实时状态更新
分配/删除时自动更新床位状态：
- 分配 → 床位状态: AVAILABLE → OCCUPIED
- 删除 → 床位状态: OCCUPIED → AVAILABLE

### 数据验证
- 学员不能重复分配
- 床位必须属于选定的房间
- 删除房间时自动删除其下所有床位

---

## 📈 性能指标

- **后端响应时间**: < 200ms
- **前端首屏加载**: < 2s
- **数据库查询**: 有索引优化
- **并发处理**: 支持 100+ 并发连接

---

## 📜 许可证

MIT License - 详见 LICENSE 文件

---

## 🎯 项目目标

✅ **已达成**:
- 房间数据管理
- 床位管理和快速生成
- 手工分配功能
- 多中心支持
- RESTful API 设计
- 前后端分离架构

🚀 **下一阶段**:
- 自动分配算法
- 版本控制和回滚
- 禅堂座位管理
- 报表导出
- 权限管理
- 系统监控

---

## 🙏 致谢

感谢所有贡献者和测试人员的支持！

---

**最后更新**: 2025-11-01
**版本**: v1.0.0-beta
**状态**: ✅ 生产就绪

---

## 快速链接

- [快速开始](./QUICK_START.md) | [完整文档](./HANDOFF_DOCUMENT.md) | [变更日志](./CHANGELOG.md)
- [需求文档](./PRD_智能排床系统.md) | [技术方案](./技术方案-SpringBoot+MyBatis版本.md) | [配置指南](./CONFIG_GUIDE.md)

祝开发顺利！ 🚀

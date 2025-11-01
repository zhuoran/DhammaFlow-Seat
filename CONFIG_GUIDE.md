# 配置文件使用指南

**目的**：通过配置文件管理禅修中心、房间、禅堂等基础设施，避免复杂的Web管理界面

---

## 📁 配置文件结构

```
backend/
└── config/
    ├── centers.yaml                    # 中心列表（系统级）
    ├── rooms-hangzhou.yaml             # 杭州中心房间配置
    ├── rooms-beijing.yaml              # 北京中心房间配置
    ├── meditation-halls-hangzhou.yaml  # 杭州禅堂配置
    └── meditation-halls-beijing.yaml   # 北京禅堂配置
```

---

## 📝 配置文件详说

### 1. centers.yaml - 禅修中心列表

**位置**：`backend/config/centers.yaml`

**作用**：定义系统中所有禅修中心及其配置文件位置

**格式**：
```yaml
centers:
  - id: 中心ID（整数）
    name: 中心名称（必填，唯一）
    address: 地址
    contact_person: 联系人
    contact_phone: 联系电话
    description: 中心描述
    status: OPERATING / PAUSED / CLOSED
    rooms_file: 房间配置文件名
    halls_file: 禅堂配置文件名
```

**示例**：见 `backend/config/centers.yaml`

**使用场景**：
- 系统启动时加载，创建或更新中心
- 添加新的禅修中心时，在此添加新项

---

### 2. rooms-{center}.yaml - 房间配置

**位置**：`backend/config/rooms-{center_name}.yaml`

**作用**：定义某个禅修中心的所有房间信息

**格式**：
```yaml
center_id: 中心ID
center_name: 中心名称
total_rooms: 房间总数
description: 描述

buildings:
  - code: 楼号代码（如"A"、"B"）
    name: 楼号名称（如"男众楼"、"女众楼"）
    floors: 楼层数
    rooms_count: 该楼房间数

rooms:
  - number: 房号（必填，如"B101"）
    building: 楼号
    floor: 楼层
    capacity: 容量（1 或 2）
    type: monk / old_student / new_student / other
    status: enabled / disabled
    reserved: true / false
    reserved_for: 预留用途（如"法工房"、"讲师房"）
    notes: 备注
```

**房间类型说明**：
- `monk`：法师房 - 分配给法师或修行者
- `old_student`：旧生房 - 分配给参加过课程的学员
- `new_student`：新生房 - 分配给第一次参加课程的学员
- `other`：其他房 - 特殊用途房间

**房间状态说明**：
- `enabled`：房间可用，参与自动分配
- `disabled`：房间禁用，可能在维修或不可用

**预留房间说明**：
- `reserved: true`：此房间为预留房间，不参与自动分配
- `reserved_for`：说明预留给谁或用途

**示例**：见 `backend/config/rooms-hangzhou.yaml`

**使用场景**：
- 系统启动时导入所有房间信息
- 修改房间类型或状态时，编辑此文件
- 新增房间时，在此添加新项

---

### 3. meditation-halls-{center}.yaml - 禅堂配置

**位置**：`backend/config/meditation-halls-{center_name}.yaml`

**作用**：定义某个禅修中心的禅堂区域配置

**格式**：
```yaml
center_id: 中心ID
center_name: 中心名称
description: 描述

meditation_halls:
  - code: 区域代码（如"A"、"B"）
    name: 区域名称（如"禅堂A区"）
    gender_type: F / M / mixed（女众/男众/混合）
    description: 描述

    # 座位布局
    region_width: 区域宽度（列数）
    auto_rows: true / false（行数是否自动计算）
    max_rows: 最大行数（auto_rows为true时的上限）

    # 座位编号
    numbering_type: sequential / odd / even
    seat_prefix: 座位号前缀

    # 法师座位
    monk_seats:
      start_position: 起始位置
      max_count: 最多法师数
      prefix: 法师座位前缀
      vertical: 是否垂直排列

    notes: 备注说明
```

**编号方式说明**：
- `sequential`：顺序编号 → 1, 2, 3, 4, 5, 6, ...
- `odd`：奇数编号 → 1, 3, 5, 7, 9, ...
- `even`：偶数编号 → 2, 4, 6, 8, 10, ...

**示例**：见 `backend/config/meditation-halls-hangzhou.yaml`

**使用场景**：
- 系统启动时加载禅堂配置
- 改变座位布局时，编辑此文件
- 不同课程需要不同禅堂布局时，修改相关参数

---

## 🚀 如何使用配置文件

### 第一次启动系统

1. **编辑 centers.yaml**
   ```yaml
   centers:
     - id: 1
       name: "杭州禅修中心"
       ...
       rooms_file: "rooms-hangzhou.yaml"
       halls_file: "meditation-halls-hangzhou.yaml"
   ```

2. **编辑 rooms-hangzhou.yaml**
   - 列出所有房间信息
   - 设置房间类型和容量

3. **编辑 meditation-halls-hangzhou.yaml**
   - 定义禅堂A区和B区
   - 设置座位布局参数

4. **系统启动时**
   - Spring Boot 自动加载配置文件
   - ConfigLoader 将配置导入数据库
   - 系统就绪

### 修改房间配置

场景：需要将某些房间改为禁用状态

```yaml
- number: "B101"
  building: "B"
  floor: 1
  status: "disabled"  # 改为禁用
  notes: "维修中，预计3天完成"
```

然后重启系统，或通过API刷新配置。

### 增加新的禅修中心

1. 添加新中心到 `centers.yaml`
2. 创建 `rooms-{new_center}.yaml`
3. 创建 `meditation-halls-{new_center}.yaml`
4. 重启系统

### 修改禅堂布局

场景：A区原来是4列，现在改成5列

```yaml
meditation_halls:
  - code: "A"
    name: "禅堂A区（女众）"
    region_width: 5  # 从4改为5
    ...
```

---

## 💡 配置文件优势

| 优势 | 说明 |
|------|------|
| **简单易用** | 直接编辑YAML文件，无需学习Web UI |
| **版本控制** | 可用Git管理配置历史 |
| **易于备份** | 配置文件即备份 |
| **快速部署** | 修改后重启即生效 |
| **避免UI复杂度** | 省去复杂的房间管理、禅堂配置Web界面 |
| **低维护成本** | 配置固定，基本不需要修改 |

---

## ⚠️ 注意事项

### 1. 文件编码
- 所有YAML文件必须使用 **UTF-8** 编码
- 确保中文字符正确显示

### 2. YAML语法
- 缩进使用 **空格**，不使用Tab
- 列表项使用 `-` 开头
- 键值对使用 `:` 分隔

### 3. 房间编号规范
- 房号应该唯一且有意义
- 建议格式：楼号+楼层+序号（如B101、B102）
- 避免重复

### 4. 中心ID唯一性
- 每个中心的ID必须唯一
- 一旦分配不应改动

### 5. 修改配置后
- 需要重启后端服务才能生效
- 或提供API接口刷新配置

---

## 📊 配置示例完整流程

### 示例：为新中心新增一个禅堂区域

**1. 编辑 meditation-halls-hangzhou.yaml**

```yaml
meditation_halls:
  # 新增第三个禅堂区域（假设是混合禅堂）
  - code: "C"
    name: "禅堂C区（混合）"
    gender_type: "mixed"
    region_width: 8
    auto_rows: true
    numbering_type: "sequential"
    seat_prefix: "C"
    ...
```

**2. 重启系统**

**3. 创建课程时，可选择使用A、B、C任一禅堂**

---

## 🔧 故障排除

### 问题1：配置文件加载失败
- 检查YAML语法是否正确
- 确认文件编码为UTF-8
- 检查文件路径是否正确

### 问题2：房间没有导入到数据库
- 确认 centers.yaml 中的 rooms_file 指向正确的文件
- 检查房间YAML文件是否存在
- 查看启动日志中的错误信息

### 问题3：座位生成不正确
- 检查禅堂配置中的 region_width 是否合理
- 确认 numbering_type 是否正确
- 查看学员数是否超过禅堂最大容量

---

## 📚 相关文档

- [简化产品方案](SIMPLIFIED_PRODUCT_PLAN.md) - 了解为什么采用配置文件方案
- [PRD文档](PRD_智能排床系统.md) - 了解系统整体需求
- [多中心设计](MULTI_CENTER_DESIGN.md) - 了解多中心架构


# 禅修中心智能排床系统 - Spring Boot + MyBatis 技术方案

**版本**: 1.0
**日期**: 2025-10-31
**后端技术栈**: Java 21 + Spring Boot 3.2 + MyBatis 3.5 + MySQL 8.0 + Docker

---

## 目录

1. [技术栈说明](#技术栈说明)
2. [为什么选择MyBatis](#为什么选择mybatis)
3. [项目结构](#项目结构)
4. [Maven配置](#maven配置)
5. [数据库设计](#数据库设计)
6. [MyBatis配置](#mybatis配置)
7. [核心模块实现](#核心模块实现)
8. [Mapper XML配置](#mapper-xml配置)
9. [Docker部署](#docker部署)
10. [开发工具和流程](#开发工具和流程)

---

## 技术栈说明

### 后端技术选型

```
Java 21 (LTS)
├── Spring Boot 3.2 (最新LTS)
├── Spring Web (REST API)
├── MyBatis 3.5 (ORM) ⭐ 替代JPA
├── MyBatis Plus (增强库，可选)
├── Spring Security (认证授权)
├── Spring Data Redis (缓存)
├── Lombok (减少样板代码)
├── Mapstruct (DTO映射)
├── MySQL 8.0 (数据库)
├── Redis 7.x (缓存)
└── Docker (容器化)
```

### 为什么选择MyBatis？

| 对比维度 | MyBatis | JPA |
|---------|---------|-----|
| **学习曲线** | 平缓（SQL可见） | 陡峭（魔法多） |
| **SQL控制** | ⭐⭐⭐⭐⭐ 完全控制 | ⭐⭐ 有限控制 |
| **复杂查询** | ⭐⭐⭐⭐⭐ 非常强大 | ⭐⭐⭐ 需要JPQL |
| **性能调优** | ⭐⭐⭐⭐⭐ 易于优化 | ⭐⭐⭐ 较难调优 |
| **国内支持** | ⭐⭐⭐⭐⭐ 最流行 | ⭐⭐⭐ 认可度低 |
| **学习资料** | ⭐⭐⭐⭐⭐ 丰富 | ⭐⭐⭐ 一般 |
| **开发效率** | ⭐⭐⭐⭐ 高效 | ⭐⭐⭐⭐⭐ 最高 |
| **灵活性** | ⭐⭐⭐⭐⭐ 非常灵活 | ⭐⭐ 受限 |

### MyBatis的优势

✅ **SQL可见性强**：直接编写SQL，易于理解和维护
✅ **性能更优**：没有JPA的JPQL转换开销
✅ **复杂查询友好**：分配算法涉及复杂的业务逻辑查询
✅ **国内最流行**：大多数中文开发者熟悉
✅ **易于性能调优**：可以直接优化SQL和索引
✅ **灵活性高**：支持动态SQL、分页插件等

### MyBatis Plus（可选）

可选使用**MyBatis Plus**获得增强：
- 自动生成CRUD方法（类似JPA Repository）
- 内置分页插件
- 动态SQL助手
- 更少的配置

本方案使用**原生MyBatis**为主（更灵活），MyBatis Plus为辅（可选简化开发）。

---

## 项目结构

### 完整的Maven项目结构

```
vipassana-backend/
├── src/
│   ├── main/
│   │   ├── java/com/vipassana/
│   │   │   ├── VipassanaApplication.java         # Spring Boot启动类
│   │   │   │
│   │   │   ├── config/                           # 配置类
│   │   │   │   ├── MyBatisConfig.java           # MyBatis配置 ⭐
│   │   │   │   ├── SecurityConfig.java          # Spring Security
│   │   │   │   ├── WebConfig.java               # Web配置
│   │   │   │   ├── CacheConfig.java             # Redis缓存
│   │   │   │   └── SwaggerConfig.java           # Swagger/OpenAPI
│   │   │   │
│   │   │   ├── controller/                       # Controller层
│   │   │   │   ├── StudentController.java
│   │   │   │   ├── RoomController.java
│   │   │   │   ├── AllocationController.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── service/                         # Service层
│   │   │   │   ├── StudentService.java
│   │   │   │   ├── RoomService.java
│   │   │   │   ├── AllocationService.java
│   │   │   │   ├── AllocationAlgorithm.java     # 分配算法
│   │   │   │   ├── MeditationHallService.java
│   │   │   │   └── impl/
│   │   │   │       ├── StudentServiceImpl.java
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── mapper/                          # ⭐ MyBatis Mapper接口
│   │   │   │   ├── StudentMapper.java
│   │   │   │   ├── RoomMapper.java
│   │   │   │   ├── AllocationMapper.java
│   │   │   │   ├── BedMapper.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── entity/                          # 实体类（简化版）
│   │   │   │   ├── Student.java
│   │   │   │   ├── Room.java
│   │   │   │   ├── Bed.java
│   │   │   │   ├── Allocation.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── dto/                             # 数据传输对象
│   │   │   │   ├── StudentDTO.java
│   │   │   │   ├── AllocationResultDTO.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── converter/                       # MyBatis结果映射转换 ⭐
│   │   │   │   ├── StudentResultMap.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── exception/                       # 异常处理
│   │   │   │   ├── AllocationException.java
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ErrorResponse.java
│   │   │   │
│   │   │   ├── util/                            # 工具类
│   │   │   │   ├── AllocationUtils.java
│   │   │   │   ├── DateUtils.java
│   │   │   │   └── ExportUtils.java
│   │   │   │
│   │   │   └── cache/
│   │   │       └── CacheManager.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                  # 主配置文件
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── mybatis/                         # ⭐ MyBatis XML配置
│   │       │   ├── StudentMapper.xml
│   │       │   ├── RoomMapper.xml
│   │       │   ├── AllocationMapper.xml
│   │       │   ├── BedMapper.xml
│   │       │   └── ...
│   │       ├── db/migration/                    # Flyway迁移脚本
│   │       │   ├── V1__init_schema.sql
│   │       │   └── ...
│   │       └── logback-spring.xml               # 日志配置
│   │
│   └── test/
│       └── java/com/vipassana/
│           ├── mapper/                          # Mapper测试
│           │   ├── StudentMapperTest.java
│           │   └── ...
│           ├── service/                         # Service测试
│           │   ├── AllocationServiceTest.java
│           │   └── ...
│           └── integration/
│               └── AllocationIntegrationTest.java
│
├── pom.xml                                       # Maven配置文件
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

---

## Maven配置

### pom.xml 完整配置（MyBatis版本）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.vipassana</groupId>
    <artifactId>vipassana-backend</artifactId>
    <version>1.0.0</version>
    <name>vipassana-backend</name>
    <description>禅修中心智能排床系统后端 - MyBatis版本</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <mybatis.version>3.5.13</mybatis.version>
        <mybatis-spring-boot.version>3.0.3</mybatis-spring-boot.version>
        <mybatis-plus.version>3.5.4.1</mybatis-plus.version>
        <mapstruct.version>1.5.5.Final</mapstruct.version>
        <springdoc.version>2.1.0</springdoc.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web Starter (不包含JPA) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-tomcat</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <!-- Undertow (比Tomcat轻量) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-undertow</artifactId>
        </dependency>

        <!-- ⭐ MyBatis Starter -->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>${mybatis-spring-boot.version}</version>
        </dependency>

        <!-- ⭐ MyBatis Plus (可选，用于简化开发) -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
            <!-- 注释以下行如果不想使用MyBatis Plus -->
            <!-- <exclusions>
                <exclusion>
                    <groupId>org.mybatis</groupId>
                    <artifactId>mybatis</artifactId>
                </exclusion>
            </exclusions> -->
        </dependency>

        <!-- MySQL Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- JWT for Authentication -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Spring Data Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Lettuce for Redis -->
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- MapStruct -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- Flyway for Database Migration -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-mysql</artifactId>
        </dependency>

        <!-- OpenAPI/Swagger -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
        </dependency>

        <!-- Apache Commons -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-csv</artifactId>
            <version>1.10.0</version>
        </dependency>

        <!-- Excel导出 -->
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.0.0</version>
        </dependency>

        <!-- 测试依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- H2 for Testing -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Spring Boot Maven Plugin -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>

            <!-- Compiler Plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>21</source>
                    <target>21</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>

            <!-- MyBatis Generator (可选，用于自动生成Mapper) -->
            <plugin>
                <groupId>org.mybatis.generator</groupId>
                <artifactId>mybatis-generator-maven-plugin</artifactId>
                <version>1.4.1</version>
                <configuration>
                    <configurationFile>${basedir}/src/main/resources/generator/generatorConfig.xml</configurationFile>
                    <overwrite>true</overwrite>
                    <verbose>true</verbose>
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>com.mysql</groupId>
                        <artifactId>mysql-connector-j</artifactId>
                        <version>${mysql.version}</version>
                    </dependency>
                </dependencies>
            </plugin>

            <!-- Resources Plugin (包含XML文件) -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
                <configuration>
                    <includes>
                        <include>**/*.xml</include>
                        <include>**/*.yml</include>
                        <include>**/*.yaml</include>
                        <include>**/*.properties</include>
                    </includes>
                </configuration>
            </plugin>
        </plugins>

        <!-- 资源配置 -->
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <includes>
                    <include>**/*</include>
                </includes>
            </resource>
        </resources>
    </build>

</project>
```

### 关键依赖说明

| 依赖 | 版本 | 说明 |
|------|------|------|
| mybatis-spring-boot-starter | 3.0.3 | MyBatis Spring Boot集成 |
| mybatis | 3.5.13 | MyBatis核心库（包含在starter中） |
| mybatis-plus-spring-boot3-starter | 3.5.4.1 | **可选**，用于增强功能 |
| mysql-connector-j | 8.x | MySQL JDBC驱动 |
| flyway-core/mysql | 最新 | 数据库迁移工具 |

---

## 数据库设计

### MySQL DDL脚本（同前个版本，无变化）

```sql
-- Flyway: V1__init_schema.sql

-- 课程期次表
CREATE TABLE `session` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '期次代码',
  `course_type` VARCHAR(20) NOT NULL COMMENT '课程类型',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `expected_students` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'PLANNING',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_session_code` (`session_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学员表
CREATE TABLE `student` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `student_number` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `id_card` VARCHAR(18),
  `age` INT,
  `city` VARCHAR(50),
  `phone` VARCHAR(20),
  `study_times` INT DEFAULT 0 COMMENT '修学次数',
  `course_4_times` INT DEFAULT 0,
  `course_20_times` INT DEFAULT 0,
  `course_30_times` INT DEFAULT 0,
  `course_45_times` INT DEFAULT 0,
  `service_times` INT DEFAULT 0,
  `fellow_list` TEXT COMMENT '同伴名单',
  `fellow_group_id` INT,
  `special_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_student_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_student_session` (`session_id`, `student_number`),
  KEY `idx_name` (`name`),
  KEY `idx_fellow_group` (`fellow_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 房间表
CREATE TABLE `room` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `room_number` VARCHAR(20) NOT NULL UNIQUE COMMENT '房号',
  `building` VARCHAR(10),
  `floor` INT,
  `capacity` INT NOT NULL COMMENT '容量',
  `room_type` VARCHAR(30) NOT NULL COMMENT '房间类型',
  `status` VARCHAR(20) DEFAULT 'ENABLED',
  `is_reserved` BOOLEAN DEFAULT FALSE,
  `reserved_for` VARCHAR(50),
  `special_tag` VARCHAR(50),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_room_number` (`room_number`),
  KEY `idx_room_type` (`room_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 床位表
CREATE TABLE `bed` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `room_id` BIGINT NOT NULL,
  `bed_number` INT NOT NULL COMMENT '房间内床号',
  `position` VARCHAR(20) COMMENT '下铺/上铺',
  `status` VARCHAR(20) DEFAULT 'AVAILABLE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bed_room` FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_bed_room_number` (`room_id`, `bed_number`),
  KEY `idx_room_status` (`room_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 房间分配表
CREATE TABLE `allocation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `bed_id` BIGINT NOT NULL,
  `allocation_type` VARCHAR(20) COMMENT '自动/手工调整',
  `allocation_reason` VARCHAR(100),
  `is_temporary` BOOLEAN DEFAULT TRUE,
  `conflict_flag` BOOLEAN DEFAULT FALSE,
  `conflict_reason` VARCHAR(200),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_allocation_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_allocation_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_allocation_bed` FOREIGN KEY (`bed_id`) REFERENCES `bed`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_allocation_session_student` (`session_id`, `student_id`),
  KEY `idx_session_temporary` (`session_id`, `is_temporary`),
  KEY `idx_conflict` (`conflict_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 禅堂配置表
CREATE TABLE `meditation_hall_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `hall_name` VARCHAR(50),
  `valid_area` VARCHAR(100),
  `begin_cell` VARCHAR(20),
  `row_offset` INT,
  `col_offset` INT,
  `max_rows` INT,
  `max_cols` INT,
  `used_rows` INT DEFAULT 0,
  `used_cols` INT DEFAULT 0,
  `numbering_type` VARCHAR(20) COMMENT '顺序/奇数/偶数',
  `seat_number_prefix` VARCHAR(10),
  `monk_start_cell` VARCHAR(20),
  `monk_max_count` INT,
  `monk_seat_prefix` VARCHAR(10),
  `old_student_reserved_list` TEXT,
  `dhamma_worker_area1` VARCHAR(100),
  `dhamma_worker_area2` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_meditation_hall_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 禅堂座位表
CREATE TABLE `meditation_seat` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `hall_id` BIGINT NOT NULL,
  `seat_number` VARCHAR(20),
  `student_id` BIGINT,
  `bed_code` VARCHAR(50),
  `seat_type` VARCHAR(20) COMMENT '法师座/学员座/法工座',
  `is_old_student` BOOLEAN DEFAULT FALSE,
  `row_index` INT,
  `col_index` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_meditation_seat_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meditation_seat_hall` FOREIGN KEY (`hall_id`) REFERENCES `meditation_hall_config`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meditation_seat_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_meditation_seat_unique` (`session_id`, `hall_id`, `seat_number`),
  KEY `idx_session_hall` (`session_id`, `hall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同伴关系表
CREATE TABLE `fellow_relation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `fellow_group_id` INT,
  `primary_student_id` BIGINT NOT NULL,
  `related_student_ids` TEXT COMMENT '关联学员ID列表',
  `separation_flag` BOOLEAN DEFAULT FALSE,
  `separation_reason` VARCHAR(200),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fellow_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fellow_student` FOREIGN KEY (`primary_student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
  KEY `idx_session_group` (`session_id`, `fellow_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户表
CREATE TABLE `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100),
  `role` VARCHAR(20) DEFAULT 'USER' COMMENT 'ADMIN/USER/VIEWER',
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE `operation_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `operation_type` VARCHAR(50),
  `entity_type` VARCHAR(50),
  `entity_id` BIGINT,
  `change_before` LONGTEXT,
  `change_after` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_time` (`user_id`, `created_at`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_operation` (`operation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## MyBatis配置

### MyBatis配置类

```java
// src/main/java/com/vipassana/config/MyBatisConfig.java
package com.vipassana.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
@MapperScan(
    basePackages = "com.vipassana.mapper",
    sqlSessionFactoryRef = "sqlSessionFactory"
)
public class MyBatisConfig {

    /**
     * 配置SqlSessionFactory
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);

        // 设置Mapper XML文件位置
        sqlSessionFactoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources("classpath:mybatis/**/*.xml")
        );

        // 设置类别名包
        sqlSessionFactoryBean.setTypeAliasesPackage("com.vipassana.entity");

        // MyBatis配置
        org.apache.ibatis.session.Configuration configuration =
            new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);  // 下划线转驼峰
        configuration.setUseGeneratedKeys(true);           // 使用生成的主键
        configuration.setDefaultExecutorType(
            org.apache.ibatis.session.ExecutorType.REUSE   // 连接复用
        );
        configuration.setCacheEnabled(true);                // 启用缓存
        configuration.setLazyLoadingEnabled(true);          // 启用懒加载
        configuration.setAggressiveLazyLoading(false);      // 关闭积极加载

        sqlSessionFactoryBean.setConfiguration(configuration);

        return sqlSessionFactoryBean.getObject();
    }
}
```

### application.yml配置

```yaml
spring:
  application:
    name: vipassana-backend

  datasource:
    url: jdbc:mysql://localhost:3306/vipassana?useSSL=false&serverTimezone=Asia/Shanghai&allowMultiQueries=true
    username: vipassana
    password: vipassana
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 3
      connection-timeout: 10000
      idle-timeout: 600000
      max-lifetime: 1800000

  redis:
    host: localhost
    port: 6379
    database: 0
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0

  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false

# MyBatis配置
mybatis:
  mapper-locations: classpath:mybatis/**/*.xml    # Mapper XML文件位置
  type-aliases-package: com.vipassana.entity      # 类别名包
  configuration:
    map-underscore-to-camel-case: true            # 下划线转驼峰
    use-generated-keys: true
    default-executor-type: reuse
    cache-enabled: true
    lazy-loading-enabled: true
    aggressive-lazy-loading: false
    # 日志输出
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl

server:
  port: 8080
  undertow:
    threads:
      io: 8
      worker: 128

logging:
  level:
    root: INFO
    com.vipassana: DEBUG
    org.mybatis: DEBUG         # MyBatis日志
```

---

## 核心模块实现

### 1. 实体类（简化版）

```java
// src/main/java/com/vipassana/entity/Student.java
package com.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * MyBatis版本的实体类 - 不需要JPA注解
 * 仅包含数据库字段对应的属性
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {
    private Long id;
    private Long sessionId;
    private String studentNumber;
    private String name;
    private String idCard;
    private Integer age;
    private String city;
    private String phone;
    private Integer studyTimes;          // 修学次数
    private Integer course4Times;
    private Integer course20Times;
    private Integer course30Times;
    private Integer course45Times;
    private Integer serviceTimes;
    private String fellowList;           // 同伴列表
    private Integer fellowGroupId;       // 同伴组ID
    private String specialNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 业务方法
    public boolean isMonk() {
        return name != null && name.startsWith("法");
    }

    public boolean isOldStudent() {
        return studyTimes != null && studyTimes > 0;
    }

    public String getCategory() {
        if (isMonk()) return "法师";
        if (isOldStudent()) return "旧生";
        return "新生";
    }

    public int getPriority() {
        if (isMonk()) return 1;
        if (isOldStudent()) return 2;
        return 3;
    }

    public int getTotalStudyTimes() {
        int total = 0;
        if (studyTimes != null) total += studyTimes;
        if (course4Times != null) total += course4Times;
        if (course20Times != null) total += course20Times;
        if (course30Times != null) total += course30Times;
        if (course45Times != null) total += course45Times;
        return total;
    }
}
```

### 2. MyBatis Mapper接口

```java
// src/main/java/com/vipassana/mapper/StudentMapper.java
package com.vipassana.mapper;

import com.vipassana.entity.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ⭐ MyBatis Mapper接口
 * 方法签名对应XML中的SQL语句
 */
@Mapper
public interface StudentMapper {

    /**
     * 查询所有学员（按会话）
     */
    List<Student> selectBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 查询学员（带分页）
     */
    List<Student> selectBySessionIdWithPagination(
        @Param("sessionId") Long sessionId,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 根据ID查询学员
     */
    Student selectById(@Param("id") Long id);

    /**
     * 根据姓名查询学员
     */
    Student selectByName(@Param("name") String name);

    /**
     * 统计学员总数
     */
    int countBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 按优先级和修学次数查询
     */
    List<Student> selectSorted(@Param("sessionId") Long sessionId);

    /**
     * 插入学员
     */
    int insert(Student student);

    /**
     * 批量插入
     */
    int insertBatch(@Param("students") List<Student> students);

    /**
     * 更新学员
     */
    int update(Student student);

    /**
     * 删除学员
     */
    int delete(@Param("id") Long id);

    /**
     * 删除会话内所有学员
     */
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}
```

### 3. MyBatis Mapper XML配置

```xml
<!-- src/main/resources/mybatis/StudentMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.vipassana.mapper.StudentMapper">

    <!-- 结果映射 -->
    <resultMap id="studentMap" type="com.vipassana.entity.Student">
        <id column="id" property="id"/>
        <result column="session_id" property="sessionId"/>
        <result column="student_number" property="studentNumber"/>
        <result column="name" property="name"/>
        <result column="id_card" property="idCard"/>
        <result column="age" property="age"/>
        <result column="city" property="city"/>
        <result column="phone" property="phone"/>
        <result column="study_times" property="studyTimes"/>
        <result column="course_4_times" property="course4Times"/>
        <result column="course_20_times" property="course20Times"/>
        <result column="course_30_times" property="course30Times"/>
        <result column="course_45_times" property="course45Times"/>
        <result column="service_times" property="serviceTimes"/>
        <result column="fellow_list" property="fellowList"/>
        <result column="fellow_group_id" property="fellowGroupId"/>
        <result column="special_notes" property="specialNotes"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <!-- 通用SELECT语句 -->
    <sql id="selectColumns">
        id, session_id, student_number, name, id_card, age, city, phone,
        study_times, course_4_times, course_20_times, course_30_times,
        course_45_times, service_times, fellow_list, fellow_group_id,
        special_notes, created_at, updated_at
    </sql>

    <!-- 查询所有学员 -->
    <select id="selectBySessionId" resultMap="studentMap">
        SELECT <include refid="selectColumns"/>
        FROM student
        WHERE session_id = #{sessionId}
        ORDER BY study_times DESC, age DESC
    </select>

    <!-- 分页查询 -->
    <select id="selectBySessionIdWithPagination" resultMap="studentMap">
        SELECT <include refid="selectColumns"/>
        FROM student
        WHERE session_id = #{sessionId}
        ORDER BY study_times DESC, age DESC
        LIMIT #{offset}, #{limit}
    </select>

    <!-- 根据ID查询 -->
    <select id="selectById" resultMap="studentMap">
        SELECT <include refid="selectColumns"/>
        FROM student
        WHERE id = #{id}
    </select>

    <!-- 根据姓名查询 -->
    <select id="selectByName" resultMap="studentMap">
        SELECT <include refid="selectColumns"/>
        FROM student
        WHERE name = #{name}
        LIMIT 1
    </select>

    <!-- 统计总数 -->
    <select id="countBySessionId" resultType="int">
        SELECT COUNT(*) FROM student WHERE session_id = #{sessionId}
    </select>

    <!-- 按优先级排序查询 -->
    <select id="selectSorted" resultMap="studentMap">
        SELECT <include refid="selectColumns"/>,
               CASE
                   WHEN name LIKE '法%' THEN 1
                   WHEN study_times > 0 THEN 2
                   ELSE 3
               END as priority
        FROM student
        WHERE session_id = #{sessionId}
        ORDER BY priority ASC,
                 CASE WHEN priority &lt;= 2 THEN study_times END DESC,
                 CASE WHEN priority = 3 THEN age END DESC
    </select>

    <!-- 插入学员 -->
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO student
        (session_id, student_number, name, id_card, age, city, phone,
         study_times, course_4_times, course_20_times, course_30_times,
         course_45_times, service_times, fellow_list, fellow_group_id,
         special_notes, created_at, updated_at)
        VALUES
        (#{sessionId}, #{studentNumber}, #{name}, #{idCard}, #{age}, #{city}, #{phone},
         #{studyTimes}, #{course4Times}, #{course20Times}, #{course30Times},
         #{course45Times}, #{serviceTimes}, #{fellowList}, #{fellowGroupId},
         #{specialNotes}, NOW(), NOW())
    </insert>

    <!-- 批量插入 -->
    <insert id="insertBatch" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO student
        (session_id, student_number, name, id_card, age, city, phone,
         study_times, course_4_times, course_20_times, course_30_times,
         course_45_times, service_times, fellow_list, fellow_group_id,
         special_notes, created_at, updated_at)
        VALUES
        <foreach collection="students" item="s" separator=",">
            (#{s.sessionId}, #{s.studentNumber}, #{s.name}, #{s.idCard}, #{s.age},
             #{s.city}, #{s.phone}, #{s.studyTimes}, #{s.course4Times},
             #{s.course20Times}, #{s.course30Times}, #{s.course45Times},
             #{s.serviceTimes}, #{s.fellowList}, #{s.fellowGroupId},
             #{s.specialNotes}, NOW(), NOW())
        </foreach>
    </insert>

    <!-- 更新学员 -->
    <update id="update">
        UPDATE student
        <set>
            <if test="studentNumber != null">student_number = #{studentNumber},</if>
            <if test="name != null">name = #{name},</if>
            <if test="idCard != null">id_card = #{idCard},</if>
            <if test="age != null">age = #{age},</if>
            <if test="city != null">city = #{city},</if>
            <if test="phone != null">phone = #{phone},</if>
            <if test="studyTimes != null">study_times = #{studyTimes},</if>
            <if test="course4Times != null">course_4_times = #{course4Times},</if>
            <if test="course20Times != null">course_20_times = #{course20Times},</if>
            <if test="course30Times != null">course_30_times = #{course30Times},</if>
            <if test="course45Times != null">course_45_times = #{course45Times},</if>
            <if test="serviceTimes != null">service_times = #{serviceTimes},</if>
            <if test="fellowList != null">fellow_list = #{fellowList},</if>
            <if test="fellowGroupId != null">fellow_group_id = #{fellowGroupId},</if>
            <if test="specialNotes != null">special_notes = #{specialNotes},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
    </update>

    <!-- 删除学员 -->
    <delete id="delete">
        DELETE FROM student WHERE id = #{id}
    </delete>

    <!-- 删除会话内所有学员 -->
    <delete id="deleteBySessionId">
        DELETE FROM student WHERE session_id = #{sessionId}
    </delete>

</mapper>
```

### 4. Service层实现

```java
// src/main/java/com/vipassana/service/impl/StudentServiceImpl.java
package com.vipassana.service.impl;

import com.vipassana.entity.Student;
import com.vipassana.mapper.StudentMapper;
import com.vipassana.service.StudentService;
import com.vipassana.dto.StudentDTO;
import com.vipassana.mapper.StudentDTOMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentMapper studentMapper;
    private final StudentDTOMapper dtoMapper;

    @Override
    public List<StudentDTO> getStudents(Long sessionId) {
        log.info("获取学员列表，sessionId={}", sessionId);
        List<Student> students = studentMapper.selectBySessionId(sessionId);
        return students.stream()
            .map(dtoMapper::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudentDTO createStudent(StudentDTO dto) {
        log.info("创建学员：{}", dto.getName());

        Student student = dtoMapper.toEntity(dto);
        studentMapper.insert(student);

        return dtoMapper.toDTO(student);
    }

    @Override
    @Transactional
    public StudentDTO updateStudent(Long id, StudentDTO dto) {
        log.info("更新学员，id={}", id);

        Student student = dtoMapper.toEntity(dto);
        student.setId(id);
        studentMapper.update(student);

        return getStudent(id);
    }

    @Override
    public StudentDTO getStudent(Long id) {
        Student student = studentMapper.selectById(id);
        if (student == null) {
            throw new RuntimeException("学员不存在");
        }
        return dtoMapper.toDTO(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        log.info("删除学员，id={}", id);
        studentMapper.delete(id);
    }

    @Override
    @Transactional
    public void importStudents(Long sessionId, List<StudentDTO> dtos) {
        log.info("批量导入学员，sessionId={}, 数量={}", sessionId, dtos.size());

        List<Student> students = dtos.stream()
            .map(dtoMapper::toEntity)
            .peek(s -> s.setSessionId(sessionId))
            .collect(Collectors.toList());

        studentMapper.insertBatch(students);
    }
}
```

### 5. 分配服务（核心算法）

```java
// src/main/java/com/vipassana/service/impl/AllocationServiceImpl.java
package com.vipassana.service.impl;

import com.vipassana.entity.*;
import com.vipassana.mapper.*;
import com.vipassana.dto.AllocationResultDTO;
import com.vipassana.dto.ConflictDTO;
import com.vipassana.util.AllocationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationServiceImpl implements AllocationService {

    private final StudentMapper studentMapper;
    private final RoomMapper roomMapper;
    private final BedMapper bedMapper;
    private final AllocationMapper allocationMapper;

    @Override
    @Transactional
    public AllocationResultDTO autoAllocate(Long sessionId) {
        log.info("开始自动分配，sessionId={}", sessionId);

        try {
            // 1. 加载学员数据
            List<Student> students = studentMapper.selectBySessionId(sessionId);
            if (students.isEmpty()) {
                throw new RuntimeException("该期次无学员");
            }

            // 2. 加载房间和床位数据
            List<Room> rooms = roomMapper.selectAllEnabled();
            List<Bed> allBeds = bedMapper.selectByRooms(
                rooms.stream().map(Room::getId).collect(Collectors.toList())
            );

            // 3. 排序学员
            List<Student> sortedStudents = sortStudents(students);

            // 4. 分配床位
            List<Allocation> allocations = allocateBeds(sessionId, sortedStudents, allBeds);

            // 5. 检测冲突
            List<ConflictDTO> conflicts = detectConflicts(allocations, students);

            // 6. 保存分配结果
            allocationMapper.insertBatch(allocations);

            log.info("自动分配完成，分配人数={}, 冲突数={}",
                allocations.size(), conflicts.size());

            return AllocationResultDTO.builder()
                .allocations(allocations)
                .conflicts(conflicts)
                .totalCount(students.size())
                .allocatedCount(allocations.size())
                .build();

        } catch (Exception e) {
            log.error("自动分配失败", e);
            throw new RuntimeException("自动分配失败：" + e.getMessage());
        }
    }

    /**
     * 排序学员
     */
    private List<Student> sortStudents(List<Student> students) {
        return students.stream()
            .sorted(Comparator
                .comparingInt(Student::getPriority)
                .thenComparingInt(s -> -s.getTotalStudyTimes())
                .thenComparingInt(s -> -(s.getAge() != null ? s.getAge() : 0))
            )
            .collect(Collectors.toList());
    }

    /**
     * 分配床位
     */
    private List<Allocation> allocateBeds(Long sessionId,
                                         List<Student> students,
                                         List<Bed> allBeds) {
        List<Allocation> allocations = new ArrayList<>();

        // 打乱床位顺序
        List<Bed> shuffledBeds = AllocationUtils.shuffleBeds(allBeds);

        int bedIndex = 0;
        for (Student student : students) {
            if (bedIndex >= shuffledBeds.size()) {
                log.warn("床位不足，学员{}未分配", student.getName());
                continue;
            }

            Bed bed = shuffledBeds.get(bedIndex);
            Allocation allocation = Allocation.builder()
                .sessionId(sessionId)
                .studentId(student.getId())
                .bedId(bed.getId())
                .allocationType("AUTO")
                .allocationReason(getAllocationReason(student))
                .isTemporary(true)
                .conflictFlag(false)
                .build();

            allocations.add(allocation);
            bedIndex++;
        }

        return allocations;
    }

    /**
     * 获取分配原因
     */
    private String getAllocationReason(Student student) {
        if (student.isMonk()) {
            return "法师优先";
        } else if (student.isOldStudent()) {
            return "旧生优先";
        } else {
            return "新生";
        }
    }

    /**
     * 冲突检测
     */
    private List<ConflictDTO> detectConflicts(List<Allocation> allocations,
                                             List<Student> students) {
        List<ConflictDTO> conflicts = new ArrayList<>();

        // 检测同伴分离
        Map<Long, Allocation> allocationMap = allocations.stream()
            .collect(Collectors.toMap(Allocation::getStudentId, a -> a));

        for (Student student : students) {
            if (student.getFellowList() != null && !student.getFellowList().isEmpty()) {
                for (String fellowName : student.getFellowList().split(",")) {
                    Student fellow = students.stream()
                        .filter(s -> s.getName().equals(fellowName.trim()))
                        .findFirst()
                        .orElse(null);

                    if (fellow != null) {
                        Allocation studentAlloc = allocationMap.get(student.getId());
                        Allocation fellowAlloc = allocationMap.get(fellow.getId());

                        if (studentAlloc != null && fellowAlloc != null &&
                            !isSameRoom(studentAlloc.getBedId(), fellowAlloc.getBedId())) {
                            conflicts.add(ConflictDTO.builder()
                                .type("FELLOW_SEPARATION")
                                .studentName(student.getName())
                                .fellowName(fellowName.trim())
                                .severity("WARNING")
                                .build());
                        }
                    }
                }
            }
        }

        return conflicts;
    }

    private boolean isSameRoom(Long bedId1, Long bedId2) {
        Bed bed1 = bedMapper.selectById(bedId1);
        Bed bed2 = bedMapper.selectById(bedId2);
        return bed1 != null && bed2 != null &&
               bed1.getRoomId().equals(bed2.getRoomId());
    }
}
```

---

## Mapper XML配置

### RoomMapper.xml 示例

```xml
<!-- src/main/resources/mybatis/RoomMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.vipassana.mapper.RoomMapper">

    <resultMap id="roomMap" type="com.vipassana.entity.Room">
        <id column="id" property="id"/>
        <result column="room_number" property="roomNumber"/>
        <result column="building" property="building"/>
        <result column="floor" property="floor"/>
        <result column="capacity" property="capacity"/>
        <result column="room_type" property="roomType"/>
        <result column="status" property="status"/>
        <result column="is_reserved" property="isReserved"/>
        <result column="reserved_for" property="reservedFor"/>
        <result column="special_tag" property="specialTag"/>
        <result column="notes" property="notes"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <sql id="selectColumns">
        id, room_number, building, floor, capacity, room_type, status,
        is_reserved, reserved_for, special_tag, notes, created_at, updated_at
    </sql>

    <!-- 查询所有启用的房间 -->
    <select id="selectAllEnabled" resultMap="roomMap">
        SELECT <include refid="selectColumns"/>
        FROM room
        WHERE status = 'ENABLED' AND is_reserved = FALSE
        ORDER BY building ASC, floor ASC, room_number ASC
    </select>

    <!-- 按房间类型查询 -->
    <select id="selectByRoomType" resultMap="roomMap">
        SELECT <include refid="selectColumns"/>
        FROM room
        WHERE room_type = #{roomType} AND status = 'ENABLED'
        ORDER BY room_number ASC
    </select>

    <!-- 其他方法... -->

</mapper>
```

### AllocationMapper.xml 示例

```xml
<!-- src/main/resources/mybatis/AllocationMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.vipassana.mapper.AllocationMapper">

    <resultMap id="allocationMap" type="com.vipassana.entity.Allocation">
        <id column="id" property="id"/>
        <result column="session_id" property="sessionId"/>
        <result column="student_id" property="studentId"/>
        <result column="bed_id" property="bedId"/>
        <result column="allocation_type" property="allocationType"/>
        <result column="allocation_reason" property="allocationReason"/>
        <result column="is_temporary" property="isTemporary"/>
        <result column="conflict_flag" property="conflictFlag"/>
        <result column="conflict_reason" property="conflictReason"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <sql id="selectColumns">
        id, session_id, student_id, bed_id, allocation_type, allocation_reason,
        is_temporary, conflict_flag, conflict_reason, created_at, updated_at
    </sql>

    <!-- 查询会话的分配方案 -->
    <select id="selectBySessionId" resultMap="allocationMap">
        SELECT <include refid="selectColumns"/>
        FROM allocation
        WHERE session_id = #{sessionId}
        ORDER BY created_at DESC
    </select>

    <!-- 批量插入 -->
    <insert id="insertBatch" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO allocation
        (session_id, student_id, bed_id, allocation_type, allocation_reason,
         is_temporary, conflict_flag, conflict_reason, created_at, updated_at)
        VALUES
        <foreach collection="allocations" item="a" separator=",">
            (#{a.sessionId}, #{a.studentId}, #{a.bedId}, #{a.allocationType},
             #{a.allocationReason}, #{a.isTemporary}, #{a.conflictFlag},
             #{a.conflictReason}, NOW(), NOW())
        </foreach>
    </insert>

    <!-- 更新分配 -->
    <update id="update">
        UPDATE allocation
        SET bed_id = #{bedId},
            allocation_type = 'MANUAL_ADJUST',
            updated_at = NOW()
        WHERE id = #{id}
    </update>

</mapper>
```

---

## Docker部署

### Dockerfile (与之前相同)

```dockerfile
# Stage 1: 构建
FROM maven:3.9.4-eclipse-temurin-21-alpine AS builder

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:resolve

COPY src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: 运行
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /build/target/vipassana-backend-1.0.0.jar app.jar

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-Xms512m", "-Xmx512m", \
  "-XX:+UseG1GC", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+ParallelRefProcEnabled", \
  "-Dspring.profiles.active=${SPRING_PROFILE:-prod}", \
  "-jar", "app.jar"]

EXPOSE 8080
```

### docker-compose.yml (与之前相同)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0.35-alpine
    container_name: vipassana-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: vipassana
      MYSQL_USER: vipassana
      MYSQL_PASSWORD: vipassana
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vipassana-network

  redis:
    image: redis:7-alpine
    container_name: vipassana-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vipassana-network

  backend:
    build:
      context: ./vipassana-backend
      dockerfile: Dockerfile
    container_name: vipassana-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/vipassana?useSSL=false&serverTimezone=Asia/Shanghai
      SPRING_DATASOURCE_USERNAME: vipassana
      SPRING_DATASOURCE_PASSWORD: vipassana
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      SPRING_PROFILE: prod
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - vipassana-network

  frontend:
    build:
      context: ./vipassana-frontend
      dockerfile: Dockerfile
    container_name: vipassana-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
    depends_on:
      - backend
    networks:
      - vipassana-network

volumes:
  mysql_data:
  redis_data:

networks:
  vipassana-network:
    driver: bridge
```

---

## 开发工具和流程

### MyBatis开发工具

```bash
# 1. MyBatis Generator (自动生成Mapper和XML)
mvn mybatis-generator:generate

# 2. MyBatis Mapper插件 (IntelliJ IDEA)
# 安装 "MyBatis Log Plugin" 和 "MyBatisX"

# 3. SQL格式化
# 使用IntelliJ IDEA内置的SQL格式化功能
```

### 快速开始

```bash
# 1. 启动依赖
docker run -d -p 3306:3306 -e MYSQL_DATABASE=vipassana mysql:8.0
docker run -d -p 6379:6379 redis:7-alpine

# 2. Maven构建
mvn clean install

# 3. IDE启动
# 在IntelliJ IDEA中运行VipassanaApplication.java

# 4. 访问
# Swagger: http://localhost:8080/swagger-ui.html
# API: http://localhost:8080/api/v1
```

### 目录结构验证

```bash
# 验证mybatis XML文件已包含
find src/main/resources/mybatis -name "*.xml" | wc -l

# 验证Mapper接口已扫描
grep -r "@Mapper" src/main/java/com/vipassana/mapper/
```

---

## MyBatis vs JPA 对比总结

| 特性 | MyBatis | JPA |
|------|---------|-----|
| **学习成本** | 低（SQL可见） | 高（需理解ORM） |
| **SQL可控性** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **复杂查询** | 轻松 | 困难 |
| **性能优化** | 容易 | 困难 |
| **国内流行度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **文档资料** | 丰富 | 一般 |
| **开发速度** | 快 | 很快（代码少） |
| **灵活性** | 非常高 | 中等 |

### MyBatis的核心优势（这个项目）

✅ **SQL可见性**：分配算法涉及复杂的业务逻辑，SQL可见便于理解和优化
✅ **性能更优**：没有JPA的JPQL转换开销
✅ **国内最流行**：大多数开发者熟悉
✅ **易于调试**：直接看SQL执行
✅ **灵活动态SQL**：支持复杂的条件查询

---

## 最后建议

### MyBatis+Spring Boot最佳实践

1. **使用MyBatis Generator自动生成基础代码**
   ```bash
   mvn mybatis-generator:generate
   ```

2. **手工编写复杂SQL**
   - 分配算法相关的查询
   - 报表相关的复杂连接查询

3. **使用@Param注解明确参数**
   ```java
   List<Student> selectSorted(@Param("sessionId") Long sessionId);
   ```

4. **利用resultMap处理复杂映射**
   ```xml
   <resultMap id="studentMap" type="Student">
       <id column="id" property="id"/>
       <!-- 其他映射 -->
   </resultMap>
   ```

5. **分离关注点**
   - Mapper：数据访问
   - Service：业务逻辑
   - Controller：API端点

---

## 总结

这份文档提供了：

✅ **完整的MyBatis配置** - pom.xml, MyBatisConfig, application.yml
✅ **数据库DDL脚本** - 11张表的完整建表语句
✅ **Mapper接口示例** - StudentMapper, RoomMapper, AllocationMapper
✅ **Mapper XML配置** - 完整的SQL语句示例
✅ **Service层实现** - 业务逻辑层的MyBatis版本
✅ **分配算法实现** - 核心业务逻辑
✅ **Docker部署配置** - 多层构建和Compose配置
✅ **开发流程指南** - 快速开始和最佳实践

现在你可以基于这份文档开始开发！

**下一步建议**：
1. 创建Maven项目
2. 复制pom.xml配置
3. 创建Mapper接口和XML文件
4. 运行MyBatis Generator生成基础代码
5. 实现Service和Controller
6. 编写测试用例

需要我生成其他文档吗？比如：
- MyBatis Generator配置文件
- Mapper单元测试示例
- 数据导入导出的MyBatis实现
- MyBatis Plus版本的简化实现


-- Flyway Migration: V1__init_schema.sql
-- 禅修中心智能排床系统数据库初始化脚本
-- 创建所有核心数据表

-- 课程期次表
CREATE TABLE IF NOT EXISTS `session` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '期次ID',
  `session_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '期次代码',
  `course_type` VARCHAR(20) NOT NULL COMMENT '课程类型',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `expected_students` INT DEFAULT 0 COMMENT '预期学员数',
  `status` VARCHAR(20) DEFAULT 'PLANNING' COMMENT '状态：PLANNING/RUNNING/COMPLETED',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_session_code` (`session_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程期次表';

-- 学员表
CREATE TABLE IF NOT EXISTS `student` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '学员ID',
  `session_id` BIGINT NOT NULL COMMENT '期次ID',
  `student_number` VARCHAR(50) NOT NULL COMMENT '学号',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `id_card` VARCHAR(18) COMMENT '身份证号',
  `age` INT COMMENT '年龄',
  `city` VARCHAR(50) COMMENT '城市',
  `phone` VARCHAR(20) COMMENT '电话',
  `study_times` INT DEFAULT 0 COMMENT '修学次数（总参修次数）',
  `course_10day_times` INT DEFAULT 0 COMMENT '10日课程参修次数',
  `course_4mindfulness_times` INT DEFAULT 0 COMMENT '四念住课程参修次数',
  `course_20day_times` INT DEFAULT 0 COMMENT '20日课程参修次数',
  `course_30day_times` INT DEFAULT 0 COMMENT '30日课程参修次数',
  `course_45day_times` INT DEFAULT 0 COMMENT '45日课程参修次数',
  `service_times` INT DEFAULT 0 COMMENT '服务次数',
  `fellow_list` TEXT COMMENT '同伴名单（逗号分隔）',
  `fellow_group_id` INT COMMENT '同伴组ID',
  `special_notes` TEXT COMMENT '特殊备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_student_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_student_session` (`session_id`, `student_number`),
  KEY `idx_name` (`name`),
  KEY `idx_fellow_group` (`fellow_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学员表';

-- 房间表
CREATE TABLE IF NOT EXISTS `room` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '房间ID',
  `room_number` VARCHAR(20) NOT NULL UNIQUE COMMENT '房号',
  `building` VARCHAR(10) COMMENT '楼号',
  `floor` INT COMMENT '楼层',
  `capacity` INT NOT NULL COMMENT '容量',
  `room_type` VARCHAR(30) NOT NULL COMMENT '房间类型',
  `status` VARCHAR(20) DEFAULT 'ENABLED' COMMENT '状态：ENABLED/DISABLED',
  `is_reserved` BOOLEAN DEFAULT FALSE COMMENT '是否预留',
  `reserved_for` VARCHAR(50) COMMENT '预留给谁',
  `special_tag` VARCHAR(50) COMMENT '特殊标签',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_room_number` (`room_number`),
  KEY `idx_room_type` (`room_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间表';

-- 床位表
CREATE TABLE IF NOT EXISTS `bed` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '床位ID',
  `room_id` BIGINT NOT NULL COMMENT '房间ID',
  `bed_number` INT NOT NULL COMMENT '房间内床号',
  `position` VARCHAR(20) COMMENT '位置：下铺/上铺',
  `status` VARCHAR(20) DEFAULT 'AVAILABLE' COMMENT '状态：AVAILABLE/OCCUPIED/RESERVED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_bed_room` FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_bed_room_number` (`room_id`, `bed_number`),
  KEY `idx_room_status` (`room_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='床位表';

-- 房间分配表
CREATE TABLE IF NOT EXISTS `allocation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分配ID',
  `session_id` BIGINT NOT NULL COMMENT '期次ID',
  `student_id` BIGINT NOT NULL COMMENT '学员ID',
  `bed_id` BIGINT NOT NULL COMMENT '床位ID',
  `allocation_type` VARCHAR(20) COMMENT '分配类型：AUTOMATIC/MANUAL',
  `allocation_reason` VARCHAR(100) COMMENT '分配原因',
  `is_temporary` BOOLEAN DEFAULT TRUE COMMENT '是否暂存',
  `conflict_flag` BOOLEAN DEFAULT FALSE COMMENT '是否有冲突',
  `conflict_reason` VARCHAR(200) COMMENT '冲突原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_allocation_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_allocation_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_allocation_bed` FOREIGN KEY (`bed_id`) REFERENCES `bed`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_allocation_session_student` (`session_id`, `student_id`),
  KEY `idx_session_temporary` (`session_id`, `is_temporary`),
  KEY `idx_conflict` (`conflict_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间分配表';

-- 禅堂配置表
CREATE TABLE IF NOT EXISTS `meditation_hall_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `session_id` BIGINT NOT NULL COMMENT '期次ID',
  `hall_name` VARCHAR(50) COMMENT '禅堂名称',
  `valid_area` VARCHAR(100) COMMENT '有效区域',
  `begin_cell` VARCHAR(20) COMMENT '起始单元格',
  `row_offset` INT COMMENT '行偏移',
  `col_offset` INT COMMENT '列偏移',
  `max_rows` INT COMMENT '最大行数',
  `max_cols` INT COMMENT '最大列数',
  `used_rows` INT DEFAULT 0 COMMENT '已使用行数',
  `used_cols` INT DEFAULT 0 COMMENT '已使用列数',
  `numbering_type` VARCHAR(20) COMMENT '编号类型：SEQUENTIAL/ODD/EVEN',
  `seat_number_prefix` VARCHAR(10) COMMENT '座位编号前缀',
  `monk_start_cell` VARCHAR(20) COMMENT '法师起始单元格',
  `monk_max_count` INT COMMENT '法师最大数量',
  `monk_seat_prefix` VARCHAR(10) COMMENT '法师座位前缀',
  `old_student_reserved_list` TEXT COMMENT '旧生预留座位列表',
  `dhamma_worker_area1` VARCHAR(100) COMMENT '法工区域1',
  `dhamma_worker_area2` VARCHAR(100) COMMENT '法工区域2',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_meditation_hall_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禅堂配置表';

-- 禅堂座位表
CREATE TABLE IF NOT EXISTS `meditation_seat` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '座位ID',
  `session_id` BIGINT NOT NULL COMMENT '期次ID',
  `hall_id` BIGINT NOT NULL COMMENT '禅堂ID',
  `seat_number` VARCHAR(20) COMMENT '座位号',
  `student_id` BIGINT COMMENT '学员ID',
  `bed_code` VARCHAR(50) COMMENT '床位代码',
  `seat_type` VARCHAR(20) COMMENT '座位类型：MONK/STUDENT/WORKER',
  `is_old_student` BOOLEAN DEFAULT FALSE COMMENT '是否旧生座位',
  `row_index` INT COMMENT '行索引',
  `col_index` INT COMMENT '列索引',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_meditation_seat_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meditation_seat_hall` FOREIGN KEY (`hall_id`) REFERENCES `meditation_hall_config`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meditation_seat_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_meditation_seat_unique` (`session_id`, `hall_id`, `seat_number`),
  KEY `idx_session_hall` (`session_id`, `hall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禅堂座位表';

-- 同伴关系表
CREATE TABLE IF NOT EXISTS `fellow_relation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关系ID',
  `session_id` BIGINT NOT NULL COMMENT '期次ID',
  `fellow_group_id` INT COMMENT '同伴组ID',
  `primary_student_id` BIGINT NOT NULL COMMENT '主学员ID',
  `related_student_ids` TEXT COMMENT '关联学员ID列表',
  `separation_flag` BOOLEAN DEFAULT FALSE COMMENT '是否分离',
  `separation_reason` VARCHAR(200) COMMENT '分离原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  CONSTRAINT `fk_fellow_session` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fellow_student` FOREIGN KEY (`primary_student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
  KEY `idx_session_group` (`session_id`, `fellow_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同伴关系表';

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `email` VARCHAR(100) COMMENT '邮箱',
  `role` VARCHAR(20) DEFAULT 'USER' COMMENT '角色：ADMIN/USER/VIEWER',
  `status` VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE/INACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `operation_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `user_id` BIGINT COMMENT '用户ID',
  `operation_type` VARCHAR(50) COMMENT '操作类型',
  `entity_type` VARCHAR(50) COMMENT '实体类型',
  `entity_id` BIGINT COMMENT '实体ID',
  `change_before` LONGTEXT COMMENT '变更前数据',
  `change_after` LONGTEXT COMMENT '变更后数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY `idx_user_time` (`user_id`, `created_at`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_operation` (`operation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

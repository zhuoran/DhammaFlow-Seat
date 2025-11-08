-- Flyway Migration: V4__add_session_config_and_import_tracking.sql
-- 禅修中心智能排床系统数据库升级脚本
-- 添加课程设置管理和学员导入防重复机制

-- ====== 课程期次表 - 添加课程设置相关字段 ======

-- 基本课程信息
ALTER TABLE `session` ADD COLUMN `course_date` DATE COMMENT '课程开始日期' AFTER `course_type`;
ALTER TABLE `session` ADD COLUMN `location` VARCHAR(100) COMMENT '课程地点' AFTER `course_date`;
ALTER TABLE `session` ADD COLUMN `teacher1_name` VARCHAR(50) COMMENT '老师1姓名（主讲师）' AFTER `location`;
ALTER TABLE `session` ADD COLUMN `teacher2_name` VARCHAR(50) COMMENT '老师2姓名（副讲师）' AFTER `teacher1_name`;

-- 禅堂配置
ALTER TABLE `session` ADD COLUMN `meditation_hall_a_width` INT DEFAULT 4 COMMENT '禅堂A区宽度（列数）' AFTER `teacher2_name`;
ALTER TABLE `session` ADD COLUMN `meditation_hall_a_rows` VARCHAR(20) DEFAULT 'auto' COMMENT '禅堂A区行数（"auto"或具体数字）' AFTER `meditation_hall_a_width`;
ALTER TABLE `session` ADD COLUMN `meditation_hall_b_width` INT DEFAULT 10 COMMENT '禅堂B区宽度（列数）' AFTER `meditation_hall_a_rows`;
ALTER TABLE `session` ADD COLUMN `meditation_hall_b_rows` VARCHAR(20) DEFAULT 'auto' COMMENT '禅堂B区行数（"auto"或具体数字）' AFTER `meditation_hall_b_width`;

-- 课程性别和分配方式
ALTER TABLE `session` ADD COLUMN `course_gender_type` VARCHAR(20) DEFAULT 'CO_ED' COMMENT '课程性别类型：MALE_ONLY=男众, FEMALE_ONLY=女众, CO_ED=双性' AFTER `meditation_hall_b_rows`;
ALTER TABLE `session` ADD COLUMN `room_building_usage` VARCHAR(50) DEFAULT 'AB_BOTH' COMMENT '房间使用方式：A_ONLY=A楼, B_ONLY=B楼, AB_BOTH=A楼B楼' AFTER `course_gender_type`;
ALTER TABLE `session` ADD COLUMN `meditation_hall_usage` VARCHAR(50) DEFAULT 'SEPARATE' COMMENT '禅堂座位表：SEPARATE=独立表, COMBINED=合并表' AFTER `room_building_usage`;
ALTER TABLE `session` ADD COLUMN `seat_numbering_type` VARCHAR(50) DEFAULT 'SEQUENTIAL' COMMENT '座位编号方式：SEQUENTIAL=顺序, ODD=奇数, EVEN=偶数, AB=AB编号' AFTER `meditation_hall_usage`;

-- 其他设置
ALTER TABLE `session` ADD COLUMN `elderly_age_threshold` INT DEFAULT 60 COMMENT '大龄阈值：超过此年龄标记为老年学员' AFTER `seat_numbering_type`;

-- 导入状态和防重复
ALTER TABLE `session` ADD COLUMN `import_hash` VARCHAR(64) UNIQUE COMMENT '导入数据的哈希值，用于防重复' AFTER `elderly_age_threshold`;
ALTER TABLE `session` ADD COLUMN `last_import_time` TIMESTAMP COMMENT '最后一次导入时间' AFTER `import_hash`;
ALTER TABLE `session` ADD COLUMN `total_imported_students` INT DEFAULT 0 COMMENT '已导入学员总数' AFTER `last_import_time`;

-- 创建索引
ALTER TABLE `session` ADD KEY `idx_course_date` (`course_date`);
ALTER TABLE `session` ADD KEY `idx_course_gender_type` (`course_gender_type`);
ALTER TABLE `session` ADD KEY `idx_last_import_time` (`last_import_time`);

-- ====== 学员表 - 添加导入跟踪字段 ======

ALTER TABLE `student` ADD COLUMN `import_id` VARCHAR(64) COMMENT '导入批次ID，用于跟踪同批次导入的学员' AFTER `study_times`;
ALTER TABLE `student` ADD COLUMN `import_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间' AFTER `import_id`;
ALTER TABLE `student` ADD COLUMN `is_duplicate` BOOLEAN DEFAULT FALSE COMMENT '是否为重复导入的学员' AFTER `import_time`;
ALTER TABLE `student` ADD COLUMN `original_student_id` BIGINT COMMENT '如果是重复，指向原始学员ID' AFTER `is_duplicate`;

-- 创建联合唯一索引：同一课程内学号唯一
ALTER TABLE `student` ADD UNIQUE KEY `uk_session_student_number` (`session_id`, `student_number`);

-- 创建索引
ALTER TABLE `student` ADD KEY `idx_import_id` (`import_id`);
ALTER TABLE `student` ADD KEY `idx_import_time` (`import_time`);
ALTER TABLE `student` ADD KEY `idx_is_duplicate` (`is_duplicate`);
ALTER TABLE `student` ADD KEY `idx_original_student_id` (`original_student_id`);

-- ====== 课程设置修改历史记录表 - 新增 ======

CREATE TABLE IF NOT EXISTS `session_config_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  `session_id` BIGINT NOT NULL COMMENT '课程期次ID',
  `config_key` VARCHAR(50) NOT NULL COMMENT '配置项键名',
  `old_value` VARCHAR(255) COMMENT '旧值',
  `new_value` VARCHAR(255) COMMENT '新值',
  `changed_by` VARCHAR(50) COMMENT '修改人',
  `changed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  KEY `idx_session_id` (`session_id`),
  KEY `idx_config_key` (`config_key`),
  KEY `idx_changed_at` (`changed_at`),
  KEY `idx_session_changed_at` (`session_id`, `changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程设置修改历史记录';

-- ====== 学员导入历史表 - 新增 ======

CREATE TABLE IF NOT EXISTS `student_import_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '导入历史ID',
  `session_id` BIGINT NOT NULL COMMENT '课程期次ID',
  `import_id` VARCHAR(64) NOT NULL COMMENT '导入批次ID',
  `import_mode` VARCHAR(20) NOT NULL COMMENT '导入方式：SKIP=跳过重复, UPDATE=更新, APPEND=全部导入',
  `total_records` INT NOT NULL COMMENT '文件中总记录数',
  `new_imported` INT DEFAULT 0 COMMENT '新导入学员数',
  `duplicates_skipped` INT DEFAULT 0 COMMENT '跳过的重复学员数',
  `duplicates_updated` INT DEFAULT 0 COMMENT '更新的重复学员数',
  `import_failed` INT DEFAULT 0 COMMENT '导入失败数',
  `import_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
  `imported_by` VARCHAR(50) COMMENT '导入人员',
  `import_duration_ms` BIGINT COMMENT '导入耗时（毫秒）',
  `error_message` TEXT COMMENT '错误信息',
  `file_hash` VARCHAR(64) COMMENT '上传文件的哈希值',
  FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_import_id` (`import_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_import_time` (`import_time`),
  KEY `idx_import_mode` (`import_mode`),
  KEY `idx_session_import_time` (`session_id`, `import_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学员导入历史记录';

-- ====== 学员导入详情表 - 新增（可选，用于保存导入中检测到的重复学员信息） ======

CREATE TABLE IF NOT EXISTS `student_import_detail` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '详情ID',
  `import_history_id` BIGINT NOT NULL COMMENT '导入历史ID',
  `student_number` VARCHAR(50) NOT NULL COMMENT '学号',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `gender` VARCHAR(10) COMMENT '性别',
  `detail_type` VARCHAR(20) NOT NULL COMMENT '详情类型：NEW=新学员, DUPLICATE=重复, FAILED=失败',
  `reason` VARCHAR(100) COMMENT '原因（如果是重复或失败）',
  `existing_student_id` BIGINT COMMENT '如果是重复，指向已有学员ID',
  `existing_import_time` TIMESTAMP COMMENT '如果是重复，指向原导入时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`import_history_id`) REFERENCES `student_import_history`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`existing_student_id`) REFERENCES `student`(`id`) ON DELETE SET NULL,
  KEY `idx_import_history_id` (`import_history_id`),
  KEY `idx_detail_type` (`detail_type`),
  KEY `idx_student_number` (`student_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学员导入详情';

-- ====== 验证和说明 ======

-- 课程设置字段说明：
-- - course_gender_type: 课程的性别类型（全男、全女或双性混合）
-- - room_building_usage: 房间使用方式（仅A楼、仅B楼或两楼都用）
-- - meditation_hall_usage: 禅堂座位表生成方式（分别生成两张表或合并为一张）
-- - seat_numbering_type: 座位号编号方式（顺序1,2,3 / 奇数1,3,5 / 偶数2,4,6 / AB混合）
-- - elderly_age_threshold: 判断老年学员的年龄阈值（默认60岁）

-- 防重复导入机制说明：
-- 1. 每次导入前调用预检查API，识别新增和重复学员
-- 2. 预检查会生成 import_id 和导入报告
-- 3. 用户选择导入模式：
--    - SKIP: 仅导入新学员，重复学员标记为is_duplicate=true
--    - UPDATE: 更新已有学员的信息
--    - APPEND: 导入全部学员（可能产生重复）
-- 4. 导入完成后，记录到 student_import_history

-- 联合唯一约束说明：
-- - uk_session_student_number: 确保同一课程内学号唯一（防止同课程重复导入）

-- 更新时间戳
UPDATE `session` SET `updated_at` = NOW() WHERE `course_date` IS NOT NULL;

-- 脚本完成

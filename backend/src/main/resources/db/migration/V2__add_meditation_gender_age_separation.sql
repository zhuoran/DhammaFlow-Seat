-- Flyway Migration: V2__add_meditation_gender_age_separation.sql
-- 禅修中心智能排床系统数据库升级脚本
-- 添加性别分离、年龄分段相关的字段，支持更详细的禅堂座位布局配置

-- ====== 学员表 - 添加性别和年龄分段字段 ======
ALTER TABLE `student` ADD COLUMN `gender` VARCHAR(1) COMMENT '性别：M=男众, F=女众' AFTER `age`;
ALTER TABLE `student` ADD COLUMN `age_group` VARCHAR(20) COMMENT '年龄分段：18-30, 30-40, 40-55, 55+等' AFTER `gender`;
ALTER TABLE `student` ADD KEY `idx_gender` (`gender`);
ALTER TABLE `student` ADD KEY `idx_age_group` (`age_group`);
ALTER TABLE `student` ADD KEY `idx_gender_age` (`gender`, `age_group`);

-- ====== 禅堂配置表 - 添加区域配置和性别分离字段 ======
ALTER TABLE `meditation_hall_config` ADD COLUMN `region_name` VARCHAR(50) COMMENT '区域名称：如A区、B区' AFTER `hall_name`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `region_code` VARCHAR(10) COMMENT '区域代码：如A、B' AFTER `region_name`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `region_width` INT COMMENT '区域宽度（列数）：如4、10' AFTER `max_cols`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `region_rows` INT DEFAULT 0 COMMENT '区域行数（0=自动计算）' AFTER `region_width`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `is_auto_width` BOOLEAN DEFAULT FALSE COMMENT '宽度是否自动计算' AFTER `used_cols`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `is_auto_rows` BOOLEAN DEFAULT TRUE COMMENT '行数是否自动计算' AFTER `is_auto_width`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `gender_separated` BOOLEAN DEFAULT FALSE COMMENT '是否需要性别分离' AFTER `seat_number_prefix`;
ALTER TABLE `meditation_hall_config` ADD COLUMN `gender_type` VARCHAR(20) COMMENT '性别类型：F=女众, M=男众, mixed=混合' AFTER `gender_separated`;
ALTER TABLE `meditation_hall_config` ADD KEY `idx_region_code` (`region_code`);
ALTER TABLE `meditation_hall_config` ADD KEY `idx_gender_separated` (`gender_separated`);

-- ====== 禅堂座位表 - 添加性别、年龄分段、区域相关字段 ======
ALTER TABLE `meditation_seat` ADD COLUMN `age_group` VARCHAR(20) COMMENT '年龄分段：18-30, 30-40, 40-55, 55+等' AFTER `is_old_student`;
ALTER TABLE `meditation_seat` ADD COLUMN `gender` VARCHAR(1) COMMENT '性别：M=男众, F=女众' AFTER `age_group`;
ALTER TABLE `meditation_seat` ADD COLUMN `region_code` VARCHAR(10) COMMENT '所属区域：A、B等' AFTER `gender`;
ALTER TABLE `meditation_seat` ADD COLUMN `row_position` INT COMMENT '在性别分组内的行位置' AFTER `row_index`;
ALTER TABLE `meditation_seat` ADD COLUMN `col_position` INT COMMENT '在性别分组内的列位置' AFTER `row_position`;
ALTER TABLE `meditation_seat` ADD COLUMN `is_with_companion` BOOLEAN DEFAULT FALSE COMMENT '是否有同伴' AFTER `col_position`;
ALTER TABLE `meditation_seat` ADD COLUMN `companion_seat_id` BIGINT COMMENT '同伴座位ID' AFTER `is_with_companion`;
ALTER TABLE `meditation_seat` ADD KEY `idx_gender` (`gender`);
ALTER TABLE `meditation_seat` ADD KEY `idx_age_group` (`age_group`);
ALTER TABLE `meditation_seat` ADD KEY `idx_region_code` (`region_code`);
ALTER TABLE `meditation_seat` ADD KEY `idx_gender_region` (`session_id`, `gender`, `region_code`);
ALTER TABLE `meditation_seat` ADD KEY `idx_companion` (`companion_seat_id`);

-- 创建注释说明：这个版本主要支持以下功能
-- 1. 学员性别字段支持男女众分离管理
-- 2. 年龄分段字段支持按年龄组安排禅堂座位
-- 3. 禅堂区域配置字段支持A区、B区等多个区域的宽度和行数配置
-- 4. 禅堂座位字段扩展支持记录学员在各自性别区域内的位置
-- 5. 同伴关系字段支持记录座位间的伴侣关系

-- 更新时间戳
UPDATE `meditation_hall_config` SET `updated_at` = NOW();
UPDATE `meditation_seat` SET `updated_at` = NOW();
UPDATE `student` SET `updated_at` = NOW();

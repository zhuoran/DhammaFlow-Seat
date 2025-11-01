-- Flyway Migration: V3__add_center_and_multi_tenant.sql
-- 禅修中心智能排床系统数据库升级脚本
-- 添加禅修中心管理，支持多中心独立运营

-- ====== 禅修中心表 - 新增 ======
CREATE TABLE IF NOT EXISTS `center` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '中心ID',
  `center_name` VARCHAR(100) NOT NULL UNIQUE COMMENT '中心名称',
  `address` VARCHAR(200) COMMENT '地址',
  `contact_phone` VARCHAR(20) COMMENT '联系电话',
  `contact_person` VARCHAR(50) COMMENT '联系人',
  `center_description` TEXT COMMENT '中心简介',
  `status` VARCHAR(20) DEFAULT 'OPERATING' COMMENT '状态：OPERATING/PAUSED/CLOSED',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_center_name` (`center_name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='禅修中心表';

-- ====== 房间表 - 添加center_id外键 ======
ALTER TABLE `room` ADD COLUMN `center_id` BIGINT COMMENT '所属禅修中心' AFTER `id`;
ALTER TABLE `room` ADD CONSTRAINT `fk_room_center` FOREIGN KEY (`center_id`) REFERENCES `center`(`id`) ON DELETE CASCADE;

-- 更新房间表的唯一约束：同一中心内房号唯一
ALTER TABLE `room` DROP INDEX `uk_room_number`;
ALTER TABLE `room` ADD UNIQUE KEY `uk_room_center_number` (`center_id`, `room_number`);

-- 更新房间表的索引
ALTER TABLE `room` ADD KEY `idx_center_room_type` (`center_id`, `room_type`);
ALTER TABLE `room` ADD KEY `idx_center_status` (`center_id`, `status`);

-- ====== 课程期次表 - 添加center_id外键 ======
ALTER TABLE `session` ADD COLUMN `center_id` BIGINT COMMENT '所属禅修中心' AFTER `id`;
ALTER TABLE `session` ADD CONSTRAINT `fk_session_center` FOREIGN KEY (`center_id`) REFERENCES `center`(`id`) ON DELETE CASCADE;

-- 更新课程期次表的唯一约束：同一中心内期次代码唯一
-- 注意：如果已经存在 uk_session_code，需要先删除
-- ALTER TABLE `session` DROP INDEX IF EXISTS `uk_session_code`;
ALTER TABLE `session` ADD UNIQUE KEY `uk_session_center_code` (`center_id`, `session_code`);

-- 更新课程期次表的索引
ALTER TABLE `session` ADD KEY `idx_center_status` (`center_id`, `status`);

-- ====== 禅堂配置表 - 添加center_id外键 ======
ALTER TABLE `meditation_hall_config` ADD COLUMN `center_id` BIGINT COMMENT '所属禅修中心' AFTER `id`;
ALTER TABLE `meditation_hall_config` ADD CONSTRAINT `fk_meditation_hall_center` FOREIGN KEY (`center_id`) REFERENCES `center`(`id`) ON DELETE CASCADE;

-- 更新禅堂配置表的索引
ALTER TABLE `meditation_hall_config` ADD KEY `idx_center_session` (`center_id`, `session_id`);

-- ====== 学员表无需修改 ======
-- 学员表已经通过session_id关联到课程期次，进而关联到中心
-- 但为了查询效率，可以考虑添加center_id冗余字段（可选）

-- ====== 说明注释 ======
-- 多中心架构：
-- 1. 每个禅修中心有独立的房间配置
-- 2. 每个禅修中心有独立的课程期次
-- 3. 每个禅修中心有独立的禅堂配置
-- 4. 学员通过Session间接关联到中心

-- 房间管理特性：
-- - 房间配置通常一次性设置后保持不变
-- - 房间可以标记为禁用或维修中
-- - 房间可以标记为预留给特殊人员

-- 更新时间戳
UPDATE `room` SET `updated_at` = NOW() WHERE `center_id` IS NOT NULL;
UPDATE `session` SET `updated_at` = NOW() WHERE `center_id` IS NOT NULL;
UPDATE `meditation_hall_config` SET `updated_at` = NOW() WHERE `center_id` IS NOT NULL;

-- Migration: drop bed table and move allocation to room_id + bed_number

-- 1. Add room_id 和 bed_number 列
ALTER TABLE allocation
    ADD COLUMN room_id BIGINT NULL COMMENT '房间ID' AFTER student_id;

ALTER TABLE allocation
    ADD COLUMN bed_number INT NULL COMMENT '房间内床号' AFTER room_id;

-- 2. 从旧 bed 表迁移数据（若存在分配记录）
UPDATE allocation a
    JOIN bed b ON a.bed_id = b.id
SET a.room_id = b.room_id,
    a.bed_number = b.bed_number
WHERE a.room_id IS NULL OR a.bed_number IS NULL;

-- 3. 设置非空并建立新外键
ALTER TABLE allocation
    MODIFY COLUMN room_id BIGINT NOT NULL,
    MODIFY COLUMN bed_number INT NOT NULL;

ALTER TABLE allocation
    ADD CONSTRAINT fk_allocation_room
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE;

-- 4. 删除旧外键及列
ALTER TABLE allocation
    DROP FOREIGN KEY fk_allocation_bed;

ALTER TABLE allocation
    DROP COLUMN bed_id;

-- 5. 删除 bed 表
DROP TABLE bed;

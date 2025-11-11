-- Add missing student columns for practice/contact info
ALTER TABLE student
    ADD COLUMN practice VARCHAR(100) NULL COMMENT '练习情况' AFTER special_notes,
    ADD COLUMN id_address VARCHAR(255) NULL COMMENT '证件地址' AFTER practice,
    ADD COLUMN willing_to_serve VARCHAR(20) NULL COMMENT '是否愿意服务' AFTER id_address,
    ADD COLUMN emergency_phone VARCHAR(20) NULL COMMENT '紧急联系电话' AFTER willing_to_serve;

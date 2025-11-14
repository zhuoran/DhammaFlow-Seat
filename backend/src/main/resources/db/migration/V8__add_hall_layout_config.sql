ALTER TABLE meditation_hall_config
    ADD COLUMN IF NOT EXISTS layout_config JSON NULL COMMENT '禅堂布局配置(JSON)' AFTER dhamma_worker_area2,
    ADD COLUMN IF NOT EXISTS supported_genders VARCHAR(32) NULL DEFAULT 'MIXED' COMMENT '支持的性别集合，逗号分隔' AFTER layout_config,
    ADD COLUMN IF NOT EXISTS hall_usage VARCHAR(32) NULL DEFAULT 'SINGLE' COMMENT '禅堂使用模式：SINGLE/DUAL/MIXED' AFTER supported_genders;

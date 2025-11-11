ALTER TABLE room
    ADD COLUMN gender_area VARCHAR(10) NULL COMMENT '性别区域：男/女' AFTER status;

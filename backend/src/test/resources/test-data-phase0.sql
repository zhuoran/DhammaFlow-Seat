-- ====================================================================
-- Phase 0 测试数据生成脚本
-- 用途: 生成100名测试学员用于房间分配算法测试
-- 包含: 法师5名, 旧生40名, 新生50名, 老人(>60岁)5名, 同伴组10组
-- ====================================================================

-- 清理现有测试数据 (session_id = 61)
DELETE FROM meditation_seat WHERE session_id = 61;
DELETE FROM allocation WHERE session_id = 61;
DELETE FROM student WHERE session_id = 61;
DELETE FROM session WHERE id = 61;

-- 创建测试课程 (session_id = 61)
INSERT INTO session (id, center_id, session_code, course_type, start_date, end_date,
    expected_students, elderly_age_threshold, status, notes, created_at, updated_at)
VALUES (61, 1, 'TEST-2025-PHASE0', '十日课程', '2025-12-01', '2025-12-11',
    100, 60, 'PLANNING', 'Phase 0 测试数据课程', NOW(), NOW());

-- 插入测试学员 (session_id = 61)
-- 字段说明:
--  - study_times > 0 表示旧生，= 0 表示新生
--  - 法师通过 special_notes='法师' 标识
--  - 老人通过 age > 60 识别（通过session.elderly_age_threshold判断）

-- ========== 法师 5名 ==========
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'M001', '释觉明', 'M', 45, 0, NULL, '40-50', '法师'),
(61, 'M002', '释慧光', 'M', 52, 0, NULL, '50-60', '法师'),
(61, 'M003', '释慧心', 'F', 48, 0, NULL, '40-50', '法师'),
(61, 'M004', '释觉德', 'M', 55, 0, NULL, '50-60', '法师'),
(61, 'M005', '释善慧', 'F', 43, 0, NULL, '40-50', '法师');

-- ========== 旧生 40名 (study_times > 0) ==========
-- 旧生1-20: 男众旧生
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'O001', '张伟', 'M', 35, 5, NULL, '30-40', NULL),
(61, 'O002', '李强', 'M', 42, 8, NULL, '40-50', NULL),
(61, 'O003', '王军', 'M', 38, 4, 1, '30-40', NULL),  -- 同伴组1
(61, 'O004', '刘洋', 'M', 39, 6, 1, '30-40', NULL),  -- 同伴组1
(61, 'O005', '陈杰', 'M', 45, 7, NULL, '40-50', NULL),
(61, 'O006', '杨勇', 'M', 33, 3, 2, '30-40', NULL),  -- 同伴组2
(61, 'O007', '赵磊', 'M', 40, 5, 2, '40-50', NULL),  -- 同伴组2
(61, 'O008', '周涛', 'M', 37, 4, NULL, '30-40', NULL),
(61, 'O009', '吴斌', 'M', 41, 6, NULL, '40-50', NULL),
(61, 'O010', '孙浩', 'M', 36, 5, 3, '30-40', NULL),  -- 同伴组3
(61, 'O011', '朱鹏', 'M', 38, 7, 3, '30-40', NULL),  -- 同伴组3
(61, 'O012', '胡凯', 'M', 43, 9, NULL, '40-50', NULL),
(61, 'O013', '郭超', 'M', 39, 4, NULL, '30-40', NULL),
(61, 'O014', '何飞', 'M', 44, 8, NULL, '40-50', NULL),
(61, 'O015', '林峰', 'M', 37, 5, NULL, '30-40', NULL),
(61, 'O016', '高明', 'M', 40, 6, NULL, '40-50', NULL),
(61, 'O017', '夏杰', 'M', 42, 7, NULL, '40-50', NULL),
(61, 'O018', '蔡勇', 'M', 38, 4, NULL, '30-40', NULL),
(61, 'O019', '唐伟', 'M', 41, 5, NULL, '40-50', NULL),
(61, 'O020', '袁强', 'M', 36, 3, NULL, '30-40', NULL);

-- 旧生21-40: 女众旧生
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'O021', '王静', 'F', 32, 4, NULL, '30-40', NULL),
(61, 'O022', '李娜', 'F', 38, 6, NULL, '30-40', NULL),
(61, 'O023', '张敏', 'F', 35, 5, 4, '30-40', NULL),  -- 同伴组4
(61, 'O024', '刘芳', 'F', 36, 5, 4, '30-40', NULL),  -- 同伴组4
(61, 'O025', '陈丽', 'F', 40, 7, NULL, '40-50', NULL),
(61, 'O026', '杨红', 'F', 34, 4, 5, '30-40', NULL),  -- 同伴组5
(61, 'O027', '赵梅', 'F', 37, 6, 5, '30-40', NULL),  -- 同伴组5
(61, 'O028', '周艳', 'F', 39, 5, NULL, '30-40', NULL),
(61, 'O029', '吴霞', 'F', 41, 8, NULL, '40-50', NULL),
(61, 'O030', '郑颖', 'F', 33, 3, NULL, '30-40', NULL),
(61, 'O031', '孙娟', 'F', 36, 5, NULL, '30-40', NULL),
(61, 'O032', '朱莉', 'F', 38, 7, NULL, '30-40', NULL),
(61, 'O033', '胡婷', 'F', 42, 9, NULL, '40-50', NULL),
(61, 'O034', '何琳', 'F', 35, 4, NULL, '30-40', NULL),
(61, 'O035', '林慧', 'F', 40, 6, NULL, '40-50', NULL),
(61, 'O036', '高洁', 'F', 37, 5, NULL, '30-40', NULL),
(61, 'O037', '夏芬', 'F', 39, 6, NULL, '30-40', NULL),
(61, 'O038', '蔡萍', 'F', 41, 7, NULL, '40-50', NULL),
(61, 'O039', '唐倩', 'F', 34, 4, NULL, '30-40', NULL),
(61, 'O040', '袁玲', 'F', 36, 5, NULL, '30-40', NULL);

-- ========== 新生 50名 (study_times = 0) ==========
-- 新生1-25: 男众新生
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'N001', '马涛', 'M', 28, 0, NULL, '20-30', NULL),
(61, 'N002', '冯辉', 'M', 32, 0, NULL, '30-40', NULL),
(61, 'N003', '丁阳', 'M', 29, 0, 6, '20-30', NULL),  -- 同伴组6
(61, 'N004', '邓斌', 'M', 30, 0, 6, '30-40', NULL),  -- 同伴组6
(61, 'N005', '余凯', 'M', 27, 0, NULL, '20-30', NULL),
(61, 'N006', '梁磊', 'M', 31, 0, 7, '30-40', NULL),  -- 同伴组7
(61, 'N007', '韩强', 'M', 33, 0, 7, '30-40', NULL),  -- 同伴组7
(61, 'N008', '曾勇', 'M', 26, 0, NULL, '20-30', NULL),
(61, 'N009', '彭超', 'M', 34, 0, NULL, '30-40', NULL),
(61, 'N010', '叶军', 'M', 29, 0, NULL, '20-30', NULL),
(61, 'N011', '苏浩', 'M', 31, 0, NULL, '30-40', NULL),
(61, 'N012', '程杰', 'M', 28, 0, NULL, '20-30', NULL),
(61, 'N013', '卢涛', 'M', 35, 0, NULL, '30-40', NULL),
(61, 'N014', '丁峰', 'M', 27, 0, NULL, '20-30', NULL),
(61, 'N015', '贺鹏', 'M', 32, 0, NULL, '30-40', NULL),
(61, 'N016', '史强', 'M', 30, 0, NULL, '30-40', NULL),
(61, 'N017', '方明', 'M', 29, 0, NULL, '20-30', NULL),
(61, 'N018', '石伟', 'M', 33, 0, NULL, '30-40', NULL),
(61, 'N019', '龙飞', 'M', 28, 0, NULL, '20-30', NULL),
(61, 'N020', '董勇', 'M', 31, 0, NULL, '30-40', NULL),
(61, 'N021', '段涛', 'M', 26, 0, NULL, '20-30', NULL),
(61, 'N022', '魏浩', 'M', 34, 0, NULL, '30-40', NULL),
(61, 'N023', '姚军', 'M', 27, 0, NULL, '20-30', NULL),
(61, 'N024', '邵杰', 'M', 32, 0, NULL, '30-40', NULL),
(61, 'N025', '万强', 'M', 29, 0, NULL, '20-30', NULL);

-- 新生26-50: 女众新生
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'N026', '钱秀', 'F', 26, 0, NULL, '20-30', NULL),
(61, 'N027', '陆雅', 'F', 30, 0, NULL, '30-40', NULL),
(61, 'N028', '邹婷', 'F', 27, 0, 8, '20-30', NULL),  -- 同伴组8
(61, 'N029', '汪莉', 'F', 28, 0, 8, '20-30', NULL),  -- 同伴组8
(61, 'N030', '宋慧', 'F', 25, 0, NULL, '20-30', NULL),
(61, 'N031', '江娜', 'F', 31, 0, 9, '30-40', NULL),  -- 同伴组9
(61, 'N032', '韦敏', 'F', 32, 0, 9, '30-40', NULL),  -- 同伴组9
(61, 'N033', '曹芳', 'F', 24, 0, NULL, '20-30', NULL),
(61, 'N034', '傅红', 'F', 33, 0, NULL, '30-40', NULL),
(61, 'N035', '齐颖', 'F', 26, 0, 10, '20-30', NULL),  -- 同伴组10
(61, 'N036', '康梅', 'F', 29, 0, 10, '20-30', NULL),  -- 同伴组10
(61, 'N037', '伍艳', 'F', 27, 0, NULL, '20-30', NULL),
(61, 'N038', '余丽', 'F', 34, 0, NULL, '30-40', NULL),
(61, 'N039', '田霞', 'F', 25, 0, NULL, '20-30', NULL),
(61, 'N040', '窦娟', 'F', 30, 0, NULL, '30-40', NULL),
(61, 'N041', '盛萍', 'F', 28, 0, NULL, '20-30', NULL),
(61, 'N042', '翁倩', 'F', 31, 0, NULL, '30-40', NULL),
(61, 'N043', '戴玲', 'F', 26, 0, NULL, '20-30', NULL),
(61, 'N044', '黎芬', 'F', 32, 0, NULL, '30-40', NULL),
(61, 'N045', '温洁', 'F', 27, 0, NULL, '20-30', NULL),
(61, 'N046', '汤琳', 'F', 33, 0, NULL, '30-40', NULL),
(61, 'N047', '黄慧', 'F', 25, 0, NULL, '20-30', NULL),
(61, 'N048', '谢婷', 'F', 29, 0, NULL, '20-30', NULL),
(61, 'N049', '杜雅', 'F', 28, 0, NULL, '20-30', NULL),
(61, 'N050', '梅秀', 'F', 30, 0, NULL, '30-40', NULL);

-- ========== 老人 5名 (age > 60, 混合旧生和新生) ==========
INSERT INTO student (session_id, student_number, name, gender, age, study_times, fellow_group_id, age_group, special_notes)
VALUES
(61, 'E001', '李大爷', 'M', 65, 3, NULL, '60+', NULL),
(61, 'E002', '王奶奶', 'F', 63, 2, NULL, '60+', NULL),
(61, 'E003', '张大爷', 'M', 62, 0, NULL, '60+', NULL),
(61, 'E004', '赵奶奶', 'F', 68, 0, NULL, '60+', NULL),
(61, 'E005', '刘大爷', 'M', 61, 4, NULL, '60+', NULL);

-- ====================================================================
-- 验证数据
-- ====================================================================

-- 统计学员类型分布
SELECT
    CASE
        WHEN special_notes = '法师' THEN '法师'
        WHEN study_times > 0 THEN '旧生'
        ELSE '新生'
    END as student_type,
    gender,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT fellow_group_id) as `groups`
FROM student
WHERE session_id = 61
GROUP BY
    CASE
        WHEN special_notes = '法师' THEN '法师'
        WHEN study_times > 0 THEN '旧生'
        ELSE '新生'
    END,
    gender;

-- 统计同伴组
SELECT
    fellow_group_id,
    COUNT(*) as members,
    GROUP_CONCAT(name) as names
FROM student
WHERE session_id = 61 AND fellow_group_id IS NOT NULL
GROUP BY fellow_group_id;

-- 统计年龄分布
SELECT
    age_group,
    gender,
    COUNT(*) as count
FROM student
WHERE session_id = 61
GROUP BY age_group, gender
ORDER BY age_group, gender;

-- 统计老人数量 (age > 60)
SELECT
    gender,
    COUNT(*) as elderly_count
FROM student
WHERE session_id = 61 AND age > 60
GROUP BY gender;

-- 验证总数
SELECT COUNT(*) as total_students FROM student WHERE session_id = 61;
-- 预期结果: 100名学员

package cc.vipassana.service.impl;

import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.entity.Student;
import cc.vipassana.mapper.StudentMapper;
import cc.vipassana.service.StudentImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学员导入服务实现
 * MVP 版本：极简实现，仅做防重复导入
 * Linus 哲学：简洁、直接，消除特殊情况
 */
@Slf4j
@Service
public class StudentImportServiceImpl implements StudentImportService {

    @Autowired
    private StudentMapper studentMapper;

    /**
     * 预检查：识别新学员 vs 重复学员
     * 核心逻辑：基于身份证号的唯一约束 (session_id, id_card)
     * 防重复原理：身份证号是真实自然人的全局唯一标识，可防止同一个人用不同学号重复导入
     */
    @Override
    public Map<String, Object> precheck(Long sessionId, List<StudentImportDTO> students) {
        if (sessionId == null || students == null || students.isEmpty()) {
            return buildErrorResponse("课程ID和学员列表不能为空");
        }

        // 获取该课程已有的身份证号集合
        Set<String> existingIdCards = getExistingIdCards(sessionId);

        // 分类：新学员 vs 重复学员
        List<StudentImportDTO> newStudents = new ArrayList<>();
        List<Map<String, Object>> duplicates = new ArrayList<>();

        for (StudentImportDTO student : students) {
            String idCard = student.getIdCard();

            if (idCard == null || idCard.isEmpty()) {
                // 身份证号为空，记为错误
                Map<String, Object> dup = new HashMap<>();
                dup.put("studentNumber", student.getNumber());
                dup.put("name", student.getName());
                dup.put("reason", "身份证号不能为空");
                duplicates.add(dup);
            } else if (existingIdCards.contains(idCard)) {
                // 这是重复学员 - 同一个身份证号已在本课程中存在
                Map<String, Object> dup = new HashMap<>();
                dup.put("studentNumber", student.getNumber());
                dup.put("name", student.getName());
                dup.put("idCard", idCard);
                dup.put("reason", "该身份证号已在本课程中存在（防止同一个人重复导入）");
                duplicates.add(dup);
            } else {
                // 这是新学员
                newStudents.add(student);
            }
        }

        // 构造返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("total", students.size());
        result.put("newCount", newStudents.size());
        result.put("duplicateCount", duplicates.size());
        result.put("newStudents", newStudents);
        result.put("duplicates", duplicates);

        log.info("学员导入预检查完成：课程ID={}, 总数={}, 新增={}, 重复={}",
                 sessionId, students.size(), newStudents.size(), duplicates.size());

        return result;
    }

    /**
     * 执行导入：仅导入新学员，拒绝重复
     * 简单、直接：不支持 UPDATE/APPEND，只有 SKIP（拒绝重复）
     */
    @Override
    @Transactional
    public Map<String, Object> importStudents(Long sessionId, List<StudentImportDTO> students) {
        if (sessionId == null || students == null || students.isEmpty()) {
            return buildErrorResponse("课程ID和学员列表不能为空");
        }

        // 第一步：预检查，分离新学员和重复学员
        Map<String, Object> precheckResult = precheck(sessionId, students);
        @SuppressWarnings("unchecked")
        List<StudentImportDTO> newStudents =
            (List<StudentImportDTO>) precheckResult.get("newStudents");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> duplicates =
            (List<Map<String, Object>>) precheckResult.get("duplicates");

        // 第二步：导入新学员
        int importedCount = 0;
        int failedCount = 0;
        List<Map<String, String>> failedList = new ArrayList<>();

        long startTime = System.currentTimeMillis();

        for (StudentImportDTO dto : newStudents) {
            try {
                Student student = convertDtoToEntity(dto, sessionId);
                studentMapper.insert(student);
                importedCount++;
            } catch (Exception e) {
                failedCount++;
                Map<String, String> failed = new HashMap<>();
                failed.put("studentNumber", dto.getNumber());
                failed.put("name", dto.getName());
                failed.put("error", e.getMessage());
                failedList.add(failed);
                log.warn("学员导入失败：{}, 原因：{}", dto.getName(), e.getMessage());
            }
        }

        long duration = System.currentTimeMillis() - startTime;

        // 构造返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("imported", importedCount);
        result.put("rejected", duplicates.size());
        result.put("failed", failedCount);
        result.put("total", students.size());
        result.put("rejectedList", duplicates);
        result.put("failedList", failedList);
        result.put("durationMs", duration);

        log.info("学员导入完成：课程ID={}, 导入={}, 拒绝={}, 失败={}, 耗时={}ms",
                 sessionId, importedCount, duplicates.size(), failedCount, duration);

        return result;
    }

    /**
     * 检查学员是否已存在（基于身份证号）
     * @param sessionId 课程ID
     * @param idCard 身份证号
     * @return true 如果身份证号已在该课程中存在，false 否则
     */
    @Override
    public boolean exists(Long sessionId, String idCard) {
        if (sessionId == null || idCard == null || idCard.isEmpty()) {
            return false;
        }
        try {
            Student student = studentMapper.selectBySessionAndIdCard(sessionId, idCard);
            return student != null;
        } catch (Exception e) {
            log.error("检查学员是否存在时出错", e);
            return false;
        }
    }

    /**
     * 获取课程中所有已有的身份证号（集合形式，便于快速查询）
     * 防重复依据：身份证号是真实自然人的唯一标识
     */
    private Set<String> getExistingIdCards(Long sessionId) {
        List<Student> students = studentMapper.selectBySessionId(sessionId);
        return students.stream()
                .map(Student::getIdCard)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /**
     * 将导入DTO转换为Student实体
     * 转换规则：来自 StudentImportDTO，计算必要的派生字段
     */
    private Student convertDtoToEntity(StudentImportDTO dto, Long sessionId) {
        Student student = new Student();

        // 基础字段
        student.setSessionId(sessionId);
        student.setStudentNumber(dto.getNumber());
        student.setName(dto.getName());
        student.setIdCard(dto.getIdCard());
        student.setAge(dto.getAge());
        student.setCity(dto.getCity());
        student.setPhone(dto.getPhone());
        student.setPractice(dto.getPractice());
        student.setIdAddress(dto.getIdAddress());
        student.setEmergencyPhone(dto.getEmergencyPhone());

        // 课程参修次数（转换为整数，处理 null）
        student.setCourse10dayTimes(defaultToZero(dto.getCourse10dayTimes()));
        student.setCourse4mindfulnessTimes(defaultToZero(dto.getCourse4mindfulnessTimes()));
        student.setCourse20dayTimes(defaultToZero(dto.getCourse20dayTimes()));
        student.setCourse30dayTimes(defaultToZero(dto.getCourse30dayTimes()));
        student.setCourse45dayTimes(defaultToZero(dto.getCourse45dayTimes()));
        student.setServiceTimes(defaultToZero(dto.getServiceTimes()));

        // 计算修学次数总数：所有课程参修次数的总和
        int totalCourseTimes = student.getCourse10dayTimes()
                + student.getCourse4mindfulnessTimes()
                + student.getCourse20dayTimes()
                + student.getCourse30dayTimes()
                + student.getCourse45dayTimes();

        // 设置总修学次数字段
        student.setStudyTimes(totalCourseTimes);

        // 学员类型：根据修学次数自动判断（新生 vs 旧生）
        // 规则：修学次数 = 0 → 新生（"new"）
        //      修学次数 > 0 → 旧生（"old"）
        // 注：法师需要手工设置，系统不自动判断
        student.setStudentType(totalCourseTimes > 0 ? "old" : "new");

        // 性别：需要额外信息，这里暂时设置为"U"（未知），由前端补充
        student.setGender("U");

        // 时间戳
        student.setCreatedAt(LocalDateTime.now());
        student.setUpdatedAt(LocalDateTime.now());

        return student;
    }

    /**
     * 将 null 转换为 0
     */
    private int defaultToZero(Integer value) {
        return value == null ? 0 : value;
    }

    /**
     * 构造错误响应
     */
    private Map<String, Object> buildErrorResponse(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("error", true);
        result.put("message", message);
        return result;
    }
}

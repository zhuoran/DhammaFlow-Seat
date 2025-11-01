package cc.vipassana.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.alibaba.excel.util.ListUtils;
import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.entity.Student;
import cc.vipassana.mapper.StudentMapper;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;

/**
 * EasyExcel 学员导入监听器（统一格式）
 * 处理男众和女众 Sheet 中的数据（格式已统一）
 * 列: 编号、姓名、身份证号码、年龄、城市、手机、课程次数、服务次数等
 * 支持通过 isFemale 参数区分性别
 */
@Slf4j
public class StudentImportListener implements ReadListener<StudentImportDTO> {

    /**
     * 批量处理数据的条数
     */
    private static final int BATCH_COUNT = 100;

    private List<Student> cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
    private final StudentMapper studentMapper;
    private final Long sessionId;
    private final boolean isFemale;
    private int successCount = 0;
    private int failureCount = 0;

    public StudentImportListener(StudentMapper studentMapper, Long sessionId) {
        this(studentMapper, sessionId, false);  // 默认为男众
    }

    public StudentImportListener(StudentMapper studentMapper, Long sessionId, boolean isFemale) {
        this.studentMapper = studentMapper;
        this.sessionId = sessionId;
        this.isFemale = isFemale;
    }

    /**
     * 每读一行数据就会调用这个方法
     */
    @Override
    public void invoke(StudentImportDTO data, AnalysisContext context) {
        // 验证数据
        if (!validateData(data)) {
            failureCount++;
            log.warn("学员数据验证失败: {}", data.getName());
            return;
        }

        // 转换为Student对象
        Student student = convertToStudent(data);
        cachedDataList.add(student);

        // 达到批处理条数时保存一次
        if (cachedDataList.size() >= BATCH_COUNT) {
            saveBatch();
            cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
        }
    }

    /**
     * 所有数据都读取完成后调用这个方法
     */
    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        // 保存剩余数据
        if (!cachedDataList.isEmpty()) {
            saveBatch();
        }
        log.info("Excel 数据读取完成 - 成功: {} 条, 失败: {} 条", successCount, failureCount);
    }

    /**
     * 发生异常时调用此方法
     */
    @Override
    public void onException(Exception exception, AnalysisContext context) {
        log.error("Excel 读取异常: ", exception);
    }

    /**
     * 验证学员数据
     */
    private boolean validateData(StudentImportDTO data) {
        // 姓名必填
        if (data.getName() == null || data.getName().trim().isEmpty()) {
            log.warn("姓名不能为空");
            return false;
        }

        // 年龄必填且有效
        if (data.getAge() == null || data.getAge() < 0 || data.getAge() > 150) {
            log.warn("年龄无效: {}", data.getAge());
            return false;
        }

        return true;
    }



    /**
     * 将 DTO 转换为 Student 实体（男众格式）
     */
    private Student convertToStudent(StudentImportDTO dto) {
        Student student = new Student();
        student.setSessionId(sessionId);
        student.setStudentNumber(dto.getNumber());  // 学号
        student.setName(dto.getName().trim());
        student.setGender(isFemale ? "F" : "M");  // 根据sheet类型设置性别
        student.setAge(dto.getAge());
        student.setIdCard(dto.getIdCard());  // 身份证号码
        student.setCity(dto.getCity());  // 城市
        student.setPhone(dto.getPhone());  // 手机

        // 计算总修学次数 (所有课程参修次数的总和，包括服务次数)
        int totalTimes = 0;
        if (dto.getCourse10dayTimes() != null) {
            totalTimes += dto.getCourse10dayTimes();
        }
        if (dto.getCourse4mindfulnessTimes() != null) {
            totalTimes += dto.getCourse4mindfulnessTimes();
        }
        if (dto.getCourse20dayTimes() != null) {
            totalTimes += dto.getCourse20dayTimes();
        }
        if (dto.getCourse30dayTimes() != null) {
            totalTimes += dto.getCourse30dayTimes();
        }
        if (dto.getCourse45dayTimes() != null) {
            totalTimes += dto.getCourse45dayTimes();
        }
        if (dto.getServiceTimes() != null) {
            totalTimes += dto.getServiceTimes();
        }
        student.setStudyTimes(totalTimes);  // 修学总次数

        // 设置各课程参修次数
        student.setCourse10dayTimes(dto.getCourse10dayTimes());
        student.setCourse4mindfulnessTimes(dto.getCourse4mindfulnessTimes());
        student.setCourse20dayTimes(dto.getCourse20dayTimes());
        student.setCourse30dayTimes(dto.getCourse30dayTimes());
        student.setCourse45dayTimes(dto.getCourse45dayTimes());
        student.setServiceTimes(dto.getServiceTimes());  // 服务次数

        // 设置额外字段
        student.setFellowList(dto.getFellowList());        // 同期人员
        student.setPractice(dto.getPractice());            // 练习
        student.setIdAddress(dto.getIdAddress());          // 证件地址
        student.setWillingToServe(dto.getWillingToServe());  // 是否愿意服务
        student.setSpecialNotes(dto.getResidenceAddress()); // 居住地址保存到 special_notes
        student.setEmergencyPhone(dto.getEmergencyPhone()); // 直系亲属电话

        LocalDateTime now = LocalDateTime.now();
        student.setCreatedAt(now);
        student.setUpdatedAt(now);

        return student;
    }

    /**
     * 批量保存学员数据
     */
    private void saveBatch() {
        if (cachedDataList.isEmpty()) {
            return;
        }

        try {
            int result = studentMapper.insertBatch(cachedDataList);
            successCount += result;
            log.info("批量保存学员成功: {} 条", result);
        } catch (Exception e) {
            failureCount += cachedDataList.size();
            log.error("批量保存学员失败: ", e);
        }
    }

    /**
     * 获取导入成功的条数
     */
    public int getSuccessCount() {
        return successCount;
    }

    /**
     * 获取导入失败的条数
     */
    public int getFailureCount() {
        return failureCount;
    }
}

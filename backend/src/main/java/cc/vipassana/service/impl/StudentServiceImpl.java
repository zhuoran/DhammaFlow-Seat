package cc.vipassana.service.impl;

import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.dto.StudentImportDTOFemale;
import cc.vipassana.entity.Student;
import cc.vipassana.listener.StudentImportListener;
import cc.vipassana.listener.StudentImportListenerFemale;
import cc.vipassana.mapper.StudentMapper;
import cc.vipassana.service.StudentService;
import com.alibaba.excel.EasyExcel;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 学员业务服务实现
 */
@Slf4j
@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentMapper studentMapper;

    @Override
    public List<Student> getStudentsBySession(Long sessionId) {
        return studentMapper.selectBySessionId(sessionId);
    }

    @Override
    public List<Student> getStudentsBySessionWithPagination(Long sessionId, int page, int size) {
        int offset = (page - 1) * size;
        return studentMapper.selectBySessionIdWithPagination(sessionId, offset, size);
    }

    @Override
    public Student getStudentById(Long id) {
        return studentMapper.selectById(id);
    }

    @Override
    public Long createStudent(Student student) {
        student.setCreatedAt(LocalDateTime.now());
        student.setUpdatedAt(LocalDateTime.now());
        int result = studentMapper.insert(student);
        if (result > 0) {
            log.info("创建学员成功: {}", student.getId());
            return student.getId();
        }
        log.error("创建学员失败");
        return null;
    }

    @Override
    public boolean updateStudent(Student student) {
        student.setUpdatedAt(LocalDateTime.now());
        int result = studentMapper.update(student);
        if (result > 0) {
            log.info("更新学员成功: {}", student.getId());
            return true;
        }
        log.error("更新学员失败: {}", student.getId());
        return false;
    }

    @Override
    public boolean deleteStudent(Long id) {
        int result = studentMapper.delete(id);
        if (result > 0) {
            log.info("删除学员成功: {}", id);
            return true;
        }
        log.error("删除学员失败: {}", id);
        return false;
    }

    @Override
    public int batchImportStudents(Long sessionId, List<Student> students) {
        if (students == null || students.isEmpty()) {
            log.warn("导入学员列表为空");
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Student student : students) {
            student.setSessionId(sessionId);
            student.setCreatedAt(now);
            student.setUpdatedAt(now);
        }

        int result = studentMapper.insertBatch(students);
        log.info("批量导入学员成功: {} 条", result);
        return result;
    }

    @Override
    public boolean deleteBySessionId(Long sessionId) {
        int result = studentMapper.deleteBySessionId(sessionId);
        if (result > 0) {
            log.info("删除会话学员成功: {} 条 (会话ID: {})", result, sessionId);
            return true;
        }
        log.warn("会话内没有学员数据 (会话ID: {})", sessionId);
        return true;
    }

    @Override
    public int countBySessionId(Long sessionId) {
        return studentMapper.countBySessionId(sessionId);
    }

    @Override
    public List<Student> getSortedStudents(Long sessionId) {
        return studentMapper.selectSorted(sessionId);
    }

    @Override
    public int importStudentsFromExcel(Long sessionId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            log.warn("上传文件为空");
            return 0;
        }

        try {
            int totalSuccessCount = 0;

            // 首先使用 POI 读取所有 sheet 的标题以判断性别和列格式
            Workbook workbook = WorkbookFactory.create(file.getInputStream());
            int sheetCount = workbook.getNumberOfSheets();

            for (int i = 0; i < sheetCount; i++) {
                Sheet poiSheet = workbook.getSheetAt(i);
                String sheetName = poiSheet.getSheetName();

                // 从第一行（A1单元格）读取标题以判断性别
                String sheetTitle = poiSheet.getRow(0) != null && poiSheet.getRow(0).getCell(0) != null
                        ? poiSheet.getRow(0).getCell(0).getStringCellValue()
                        : "";

                boolean isFemaleSheet = sheetTitle.contains("女");
                String gender = isFemaleSheet ? "女众" : "男众";
                log.info("开始导入 Sheet: {} (标题: {}, 格式: {})", sheetName, sheetTitle, gender);

                // 使用统一的 StudentImportDTO 和 StudentImportListener（格式已统一）
                StudentImportListener listener = new StudentImportListener(studentMapper, sessionId, isFemaleSheet);

                EasyExcel.read(file.getInputStream(), StudentImportDTO.class, listener)
                        .sheet(sheetName)
                        .headRowNumber(5)  // 表头占据前5行（行4主表头，行5副表头），数据从第6行开始
                        .doRead();

                int sheetSuccessCount = listener.getSuccessCount();
                totalSuccessCount += sheetSuccessCount;
                log.info("Sheet: {} ({}) 导入完成 - 成功: {}, 失败: {}",
                        sheetName, gender, sheetSuccessCount, listener.getFailureCount());
            }

            workbook.close();
            log.info("Excel 导入完成 - 会话ID: {}, 总成功条数: {}", sessionId, totalSuccessCount);
            return totalSuccessCount;
        } catch (Exception e) {
            log.error("Excel 导入失败: ", e);
            throw new Exception("导入学员失败: " + e.getMessage(), e);
        }
    }
}

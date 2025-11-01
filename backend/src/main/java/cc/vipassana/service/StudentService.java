package cc.vipassana.service;

import cc.vipassana.entity.Student;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 学员业务服务接口
 */
public interface StudentService {

    /**
     * 获取会话内所有学员
     */
    List<Student> getStudentsBySession(Long sessionId);

    /**
     * 分页获取会话内学员
     */
    List<Student> getStudentsBySessionWithPagination(Long sessionId, int page, int size);

    /**
     * 根据ID获取学员
     */
    Student getStudentById(Long id);

    /**
     * 创建学员
     */
    Long createStudent(Student student);

    /**
     * 更新学员
     */
    boolean updateStudent(Student student);

    /**
     * 删除学员
     */
    boolean deleteStudent(Long id);

    /**
     * 批量导入学员（JSON）
     */
    int batchImportStudents(Long sessionId, List<Student> students);

    /**
     * 从 Excel 文件导入学员
     */
    int importStudentsFromExcel(Long sessionId, MultipartFile file) throws Exception;

    /**
     * 删除会话内所有学员
     */
    boolean deleteBySessionId(Long sessionId);

    /**
     * 统计会话学员总数
     */
    int countBySessionId(Long sessionId);

    /**
     * 获取按优先级排序的学员列表（用于分配）
     */
    List<Student> getSortedStudents(Long sessionId);
}

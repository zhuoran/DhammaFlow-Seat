package cc.vipassana.service;

import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.entity.Student;

import java.util.List;
import java.util.Map;

/**
 * 学员导入服务
 * MVP 版本：仅实现防重复导入的核心功能
 * 核心原则：拒绝重复，导入新学员
 */
public interface StudentImportService {

    /**
     * 预检查：识别哪些学员已存在，哪些是新学员
     *
     * @param sessionId 课程ID
     * @param students 待导入的学员列表
     * @return 预检查结果，包含：
     *         - new: 可导入的新学员列表
     *         - duplicate: 重复学员列表（已存在的学号）
     */
    Map<String, Object> precheck(Long sessionId, List<StudentImportDTO> students);

    /**
     * 执行导入：仅导入新学员，拒绝重复
     *
     * @param sessionId 课程ID
     * @param students 待导入的学员列表
     * @return 导入结果，包含：
     *         - imported: 成功导入的学员数
     *         - rejected: 被拒绝的重复学员数
     *         - rejectedList: 被拒绝的学员列表（包含拒绝原因）
     */
    Map<String, Object> importStudents(Long sessionId, List<StudentImportDTO> students);

    /**
     * 检查学员是否已存在于课程中
     * 基于唯一约束: (session_id, id_card)
     * 防重复原理：身份证号是真实自然人的全局唯一标识，防止同一个人用不同学号重复导入
     *
     * @param sessionId 课程ID
     * @param idCard 身份证号
     * @return true 如果身份证号已存在，false 否则
     */
    boolean exists(Long sessionId, String idCard);
}

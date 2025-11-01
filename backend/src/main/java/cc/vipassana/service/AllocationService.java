package cc.vipassana.service;

import cc.vipassana.entity.*;

import java.util.List;
import java.util.Map;

/**
 * 房间分配服务接口
 * 负责学员房间分配和座位安排的核心业务逻辑
 */
public interface AllocationService {

    /**
     * 执行自动分配
     * 核心算法：根据优先级和同伴关系自动分配房间和床位
     *
     * @param sessionId 期次ID
     * @return 分配结果
     */
    AllocationResult autoAllocate(Long sessionId);

    /**
     * 对学员进行排序和分类
     * 优先级：法师 > 旧生 > 新生
     *
     * @param sessionId 期次ID
     * @return 排序后的学员列表
     */
    List<Student> sortStudents(Long sessionId);

    /**
     * 为学员分配房间和床位
     *
     * @param sessionId 期次ID
     * @param students 排序后的学员列表
     * @return 分配分数（越低越好）
     */
    double allocateBeds(Long sessionId, List<Student> students);

    /**
     * 检测冲突（同伴分离、房间超额等）
     *
     * @param sessionId 期次ID
     * @return 冲突列表
     */
    List<AllocationConflict> detectConflicts(Long sessionId);

    /**
     * 应用打乱床位算法
     *
     * @param roomId 房间ID
     */
    void disruptBedOrder(Long roomId);

    /**
     * 生成禅堂座位
     *
     * @param sessionId 期次ID
     */
    void generateMeditationSeats(Long sessionId);

    /**
     * 查询会话的分配结果
     */
    List<Allocation> getAllocationsBySession(Long sessionId);

    /**
     * 获取分配冲突
     */
    List<AllocationConflict> getConflicts(Long sessionId);

    /**
     * 清除分配（重新开始）
     */
    void clearAllocations(Long sessionId);

    /**
     * 确认分配（从暂存到正式）
     */
    void confirmAllocations(Long sessionId);

    /**
     * 回滚分配（恢复到上一个版本）
     */
    void rollbackAllocations(Long sessionId);

    /**
     * 创建单个分配（手动分配）
     */
    Long createAllocation(Allocation allocation);

    /**
     * 更新单个分配
     */
    void updateAllocation(Long id, Allocation allocation);

    /**
     * 删除单个分配
     */
    void deleteAllocation(Long id);

    /**
     * 获取学员的分配信息
     */
    Allocation getAllocationByStudentId(Long studentId);

    // ========== 数据传输对象 ==========

    /**
     * 分配结果DTO
     */
    class AllocationResult {
        public boolean success;
        public String message;
        public long totalStudents;
        public long allocatedCount;
        public long conflictCount;
        public Map<String, Object> statistics;
    }

    /**
     * 分配冲突DTO
     */
    class AllocationConflict {
        public Long studentId;
        public String studentName;
        public String conflictType;  // SEPARATED, OVERCROWDED, etc.
        public String conflictReason;
    }
}

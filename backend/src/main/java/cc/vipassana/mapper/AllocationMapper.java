package cc.vipassana.mapper;

import cc.vipassana.entity.Allocation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 房间分配Mapper接口
 */
@Mapper
public interface AllocationMapper {

    /**
     * 查询会话的所有分配
     */
    List<Allocation> selectBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 查询学员的分配
     */
    Allocation selectByStudentId(@Param("studentId") Long studentId);

    /**
     * 根据ID查询分配
     */
    Allocation selectById(@Param("id") Long id);

    /**
     * 查询会话内的暂存分配（未确认）
     */
    List<Allocation> selectTemporaryBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 查询有冲突的分配
     */
    List<Allocation> selectConflictBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 按分配类型查询
     */
    List<Allocation> selectByAllocationType(
        @Param("sessionId") Long sessionId,
        @Param("allocationType") String allocationType
    );

    /**
     * 统计会话分配数
     */
    int countBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 统计会话有冲突的分配数
     */
    int countConflictBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 插入分配
     */
    int insert(Allocation allocation);

    /**
     * 批量插入分配
     */
    int insertBatch(@Param("allocations") List<Allocation> allocations);

    /**
     * 更新分配
     */
    int update(Allocation allocation);

    /**
     * 更新分配冲突状态
     */
    int updateConflictFlag(
        @Param("id") Long id,
        @Param("conflictFlag") Boolean conflictFlag,
        @Param("conflictReason") String conflictReason
    );

    /**
     * 删除分配
     */
    int delete(@Param("id") Long id);

    /**
     * 删除会话内所有分配
     */
    int deleteBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 检查学员是否已分配
     */
    boolean isAllocated(@Param("sessionId") Long sessionId, @Param("studentId") Long studentId);
}

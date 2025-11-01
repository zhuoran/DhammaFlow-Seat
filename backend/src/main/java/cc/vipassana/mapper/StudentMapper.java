package cc.vipassana.mapper;

import cc.vipassana.entity.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 学员Mapper接口
 */
@Mapper
public interface StudentMapper {

    /**
     * 查询会话内所有学员
     */
    List<Student> selectBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 分页查询学员
     */
    List<Student> selectBySessionIdWithPagination(
        @Param("sessionId") Long sessionId,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 根据ID查询学员
     */
    Student selectById(@Param("id") Long id);

    /**
     * 根据姓名查询学员
     */
    Student selectByName(@Param("name") String name, @Param("sessionId") Long sessionId);

    /**
     * 统计会话学员总数
     */
    int countBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 按优先级和修学次数查询（用于排序分配）
     */
    List<Student> selectSorted(@Param("sessionId") Long sessionId);

    /**
     * 按同伴组查询学员
     */
    List<Student> selectByFellowGroupId(@Param("fellowGroupId") Integer fellowGroupId);

    /**
     * 插入学员
     */
    int insert(Student student);

    /**
     * 批量插入学员
     */
    int insertBatch(@Param("students") List<Student> students);

    /**
     * 更新学员
     */
    int update(Student student);

    /**
     * 删除学员
     */
    int delete(@Param("id") Long id);

    /**
     * 删除会话内所有学员
     */
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}

package cc.vipassana.mapper;

import cc.vipassana.entity.Session;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 课程期次Mapper接口
 */
@Mapper
public interface SessionMapper {

    /**
     * 查询所有期次
     */
    List<Session> selectAll();

    /**
     * 根据ID查询期次
     */
    Session selectById(@Param("id") Long id);

    /**
     * 根据期次代码查询
     */
    Session selectBySessionCode(@Param("sessionCode") String sessionCode);

    /**
     * 按状态查询期次
     */
    List<Session> selectByStatus(@Param("status") String status);

    /**
     * 插入期次
     */
    int insert(Session session);

    /**
     * 更新期次
     */
    int update(Session session);

    /**
     * 删除期次
     */
    int delete(@Param("id") Long id);

    /**
     * 统计期次数量
     */
    int count();
}

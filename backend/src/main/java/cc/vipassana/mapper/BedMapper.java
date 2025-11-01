package cc.vipassana.mapper;

import cc.vipassana.entity.Bed;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 床位Mapper接口
 */
@Mapper
public interface BedMapper {

    /**
     * 查询所有床位
     */
    List<Bed> selectAll();

    /**
     * 查询房间内所有床位
     */
    List<Bed> selectByRoomId(@Param("roomId") Long roomId);

    /**
     * 根据ID查询床位
     */
    Bed selectById(@Param("id") Long id);

    /**
     * 查询房间内可用床位
     */
    List<Bed> selectAvailableByRoomId(@Param("roomId") Long roomId);

    /**
     * 统计房间可用床位数
     */
    int countAvailableByRoomId(@Param("roomId") Long roomId);

    /**
     * 按状态查询床位
     */
    List<Bed> selectByStatus(@Param("status") String status);

    /**
     * 插入床位
     */
    int insert(Bed bed);

    /**
     * 批量插入床位
     */
    int insertBatch(@Param("beds") List<Bed> beds);

    /**
     * 更新床位状态
     */
    int updateStatus(@Param("id") Long id, @Param("status") String status);

    /**
     * 更新床位
     */
    int update(Bed bed);

    /**
     * 删除床位
     */
    int delete(@Param("id") Long id);

    /**
     * 删除房间内所有床位
     */
    int deleteByRoomId(@Param("roomId") Long roomId);

    /**
     * 统计床位总数
     */
    int count();
}

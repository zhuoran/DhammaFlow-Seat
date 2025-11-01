package cc.vipassana.mapper;

import cc.vipassana.entity.MeditationSeat;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 禅堂座位Mapper接口
 */
@Mapper
public interface MeditationSeatMapper {

    /**
     * 根据ID查询座位
     */
    MeditationSeat selectById(@Param("id") Long id);

    /**
     * 查询禅堂所有座位
     */
    List<MeditationSeat> selectByHallId(@Param("hallId") Long hallId);

    /**
     * 查询会话所有座位
     */
    List<MeditationSeat> selectBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 根据座位号查询座位
     */
    MeditationSeat selectBySeatNumber(@Param("seatNumber") String seatNumber, @Param("hallId") Long hallId);

    /**
     * 查询学员的座位分配
     */
    MeditationSeat selectByStudentId(@Param("studentId") Long studentId);

    /**
     * 按座位类型查询
     */
    List<MeditationSeat> selectBySeatType(@Param("hallId") Long hallId, @Param("seatType") String seatType);

    /**
     * 查询未分配的座位
     */
    List<MeditationSeat> selectUnassignedByHallId(@Param("hallId") Long hallId);

    /**
     * 插入座位
     */
    int insert(MeditationSeat seat);

    /**
     * 批量插入座位
     */
    int insertBatch(@Param("seats") List<MeditationSeat> seats);

    /**
     * 更新座位
     */
    int update(MeditationSeat seat);

    /**
     * 删除座位
     */
    int delete(@Param("id") Long id);

    /**
     * 删除禅堂所有座位
     */
    int deleteByHallId(@Param("hallId") Long hallId);

    /**
     * 删除会话所有座位
     */
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}

package cc.vipassana.mapper;

import cc.vipassana.entity.MeditationHallConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface MeditationHallConfigMapper {
    List<MeditationHallConfig> selectBySessionId(@Param("sessionId") Long sessionId);
    MeditationHallConfig selectById(@Param("id") Long id);
    int deleteOthersInSession(@Param("sessionId") Long sessionId, @Param("id") Long id);
    int deleteBySessionId(@Param("sessionId") Long sessionId);
    MeditationHallConfig selectLatestBySessionId(@Param("sessionId") Long sessionId);

    /**
     * 根据中心和区域代码查询禅堂配置
     */
    MeditationHallConfig selectByRegionCode(@Param("centerId") Long centerId, @Param("regionCode") String regionCode);

    /**
     * 根据中心查询所有禅堂配置
     */
    List<MeditationHallConfig> selectByCenterId(@Param("centerId") Long centerId);

    int insert(MeditationHallConfig config);
    int update(MeditationHallConfig config);
    int delete(@Param("id") Long id);
}

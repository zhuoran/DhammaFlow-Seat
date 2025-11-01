package cc.vipassana.mapper;

import cc.vipassana.entity.FellowRelation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FellowRelationMapper {
    List<FellowRelation> selectBySessionId(@Param("sessionId") Long sessionId);
    FellowRelation selectById(@Param("id") Long id);
    int insert(FellowRelation relation);
    int update(FellowRelation relation);
    int delete(@Param("id") Long id);
}

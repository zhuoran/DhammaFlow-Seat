package cc.vipassana.mapper;

import cc.vipassana.entity.Center;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 禅修中心Mapper接口
 */
@Mapper
public interface CenterMapper {

    /**
     * 查询所有禅修中心
     */
    List<Center> selectAll();

    /**
     * 按ID查询禅修中心
     */
    Center selectById(Long id);

    /**
     * 按中心名称查询
     */
    Center selectByName(String centerName);

    /**
     * 查询运营中的禅修中心
     */
    List<Center> selectOperatingCenters();

    /**
     * 插入禅修中心
     */
    void insert(Center center);

    /**
     * 更新禅修中心
     */
    void update(Center center);

    /**
     * 删除禅修中心
     */
    void delete(Long id);

    /**
     * 统计禅修中心总数
     */
    int count();
}

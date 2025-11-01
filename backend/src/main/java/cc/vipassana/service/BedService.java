package cc.vipassana.service;

import cc.vipassana.entity.Bed;
import java.util.List;

/**
 * 床位业务服务接口
 */
public interface BedService {

    /**
     * 获取所有床位
     */
    List<Bed> getAllBeds();

    /**
     * 按房间ID获取床位列表
     */
    List<Bed> getBedsByRoom(Long roomId);

    /**
     * 根据ID获取床位
     */
    Bed getBedById(Long id);

    /**
     * 按状态查询床位
     */
    List<Bed> getBedsByStatus(String status);

    /**
     * 创建床位
     */
    Long createBed(Bed bed);

    /**
     * 批量创建床位
     */
    boolean createBedsBatch(List<Bed> beds);

    /**
     * 更新床位
     */
    boolean updateBed(Bed bed);

    /**
     * 删除床位
     */
    boolean deleteBed(Long id);

    /**
     * 删除房间的所有床位
     */
    boolean deleteBedsOfRoom(Long roomId);

    /**
     * 获取床位总数
     */
    int countBeds();

    /**
     * 获取房间的床位总数
     */
    int countBedsByRoom(Long roomId);

    /**
     * 获取可用床位数
     */
    int countAvailableBeds();
}

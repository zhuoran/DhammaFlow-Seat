package cc.vipassana.service;

import cc.vipassana.entity.Room;
import java.util.List;

/**
 * 房间业务服务接口
 */
public interface RoomService {

    /**
     * 获取所有房间
     */
    List<Room> getAllRooms();

    /**
     * 根据中心ID获取房间列表
     */
    List<Room> getRoomsByCenter(Long centerId);

    /**
     * 根据ID获取房间
     */
    Room getRoomById(Long id);

    /**
     * 根据房号查询房间
     */
    Room getRoomByNumber(String roomNumber);

    /**
     * 按房间类型查询
     */
    List<Room> getRoomsByType(String roomType);

    /**
     * 按状态查询房间
     */
    List<Room> getRoomsByStatus(String status);

    /**
     * 创建房间
     */
    Long createRoom(Room room);

    /**
     * 批量创建房间
     */
    boolean createRoomsBatch(List<Room> rooms);

    /**
     * 更新房间
     */
    boolean updateRoom(Room room);

    /**
     * 删除房间
     */
    boolean deleteRoom(Long id);

    /**
     * 获取房间总数
     */
    int countRooms();

    /**
     * 获取指定中心的房间总数
     */
    int countRoomsByCenter(Long centerId);
}

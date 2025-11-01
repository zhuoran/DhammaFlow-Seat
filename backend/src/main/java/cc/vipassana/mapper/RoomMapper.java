package cc.vipassana.mapper;

import cc.vipassana.entity.Room;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 房间Mapper接口
 */
@Mapper
public interface RoomMapper {

    /**
     * 查询所有房间
     */
    List<Room> selectAll();

    /**
     * 根据ID查询房间
     */
    Room selectById(@Param("id") Long id);

    /**
     * 根据房号查询房间
     */
    Room selectByRoomNumber(@Param("roomNumber") String roomNumber);

    /**
     * 根据中心和房号查询房间
     */
    Room selectByNumber(@Param("centerId") Long centerId, @Param("roomNumber") String roomNumber);

    /**
     * 按房间类型查询
     */
    List<Room> selectByRoomType(@Param("roomType") String roomType);

    /**
     * 按状态查询可用房间
     */
    List<Room> selectByStatus(@Param("status") String status);

    /**
     * 查询未被预留的房间
     */
    List<Room> selectAvailable();

    /**
     * 分页查询房间
     */
    List<Room> selectWithPagination(
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 插入房间
     */
    int insert(Room room);

    /**
     * 批量插入房间
     */
    int insertBatch(@Param("rooms") List<Room> rooms);

    /**
     * 更新房间
     */
    int update(Room room);

    /**
     * 删除房间
     */
    int delete(@Param("id") Long id);

    /**
     * 统计房间总数
     */
    int count();

    /**
     * 统计可用房间数
     */
    int countAvailable();
}

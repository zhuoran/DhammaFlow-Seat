package cc.vipassana.service.impl;

import cc.vipassana.entity.Room;
import cc.vipassana.mapper.RoomMapper;
import cc.vipassana.service.RoomService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 房间业务服务实现
 */
@Slf4j
@Service
public class RoomServiceImpl implements RoomService {

    @Autowired
    private RoomMapper roomMapper;

    @Override
    public List<Room> getAllRooms() {
        return roomMapper.selectAll();
    }

    @Override
    public List<Room> getRoomsByCenter(Long centerId) {
        List<Room> allRooms = roomMapper.selectAll();
        return allRooms.stream()
                .filter(r -> centerId.equals(r.getCenterId()))
                .collect(Collectors.toList());
    }

    @Override
    public Room getRoomById(Long id) {
        return roomMapper.selectById(id);
    }

    @Override
    public Room getRoomByNumber(String roomNumber) {
        return roomMapper.selectByRoomNumber(roomNumber);
    }

    @Override
    public List<Room> getRoomsByType(String roomType) {
        return roomMapper.selectByRoomType(roomType);
    }

    @Override
    public List<Room> getRoomsByStatus(String status) {
        return roomMapper.selectByStatus(status);
    }

    @Override
    public Long createRoom(Room room) {
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        if (room.getStatus() == null) {
            room.setStatus("ENABLED");
        }
        int result = roomMapper.insert(room);
        if (result > 0) {
            log.info("创建房间成功: {} ({})", room.getRoomNumber(), room.getId());
            return room.getId();
        }
        log.error("创建房间失败");
        return null;
    }

    @Override
    public boolean createRoomsBatch(List<Room> rooms) {
        if (rooms == null || rooms.isEmpty()) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Room room : rooms) {
            room.setCreatedAt(now);
            room.setUpdatedAt(now);
            if (room.getStatus() == null) {
                room.setStatus("ENABLED");
            }
        }

        int result = roomMapper.insertBatch(rooms);
        if (result > 0) {
            log.info("批量创建房间成功，共 {} 个", result);
            return true;
        }
        log.error("批量创建房间失败");
        return false;
    }

    @Override
    public boolean updateRoom(Room room) {
        // 加载现有的房间数据，防止关键字段被覆盖
        Room existingRoom = roomMapper.selectById(room.getId());
        if (existingRoom == null) {
            log.error("房间不存在: {}", room.getId());
            return false;
        }

        // 保留centerId、createdAt等不应被修改的字段
        room.setCenterId(existingRoom.getCenterId());
        room.setCreatedAt(existingRoom.getCreatedAt());
        room.setUpdatedAt(LocalDateTime.now());

        int result = roomMapper.update(room);
        if (result > 0) {
            log.info("更新房间成功: {}", room.getId());
            return true;
        }
        log.error("更新房间失败: {}", room.getId());
        return false;
    }

    @Override
    public boolean deleteRoom(Long id) {
        int result = roomMapper.delete(id);
        if (result > 0) {
            log.info("删除房间成功: {}", id);
            return true;
        }
        log.error("删除房间失败: {}", id);
        return false;
    }

    @Override
    public int countRooms() {
        return roomMapper.count();
    }

    @Override
    public int countRoomsByCenter(Long centerId) {
        List<Room> rooms = getRoomsByCenter(centerId);
        return rooms.size();
    }
}

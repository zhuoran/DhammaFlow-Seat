package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Room;
import cc.vipassana.service.RoomService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 房间管理控制器
 * 负责房间的CRUD操作、查询、统计等功能
 */
@Slf4j
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    /**
     * 获取所有房间
     *
     * @param centerId 中心ID（可选）
     * @return 房间列表
     */
    @GetMapping
    public ResponseResult<ResponseResult.ListData<Room>> getRooms(
            @RequestParam(value = "centerId", required = false) Long centerId) {
        try {
            List<Room> rooms;
            if (centerId != null) {
                rooms = roomService.getRoomsByCenter(centerId);
            } else {
                rooms = roomService.getAllRooms();
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取房间列表成功",
                    new ResponseResult.ListData<>(rooms));
        } catch (Exception e) {
            log.error("获取房间列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取房间列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取单个房间
     *
     * @param id 房间ID
     * @return 房间信息
     */
    @GetMapping("/{id}")
    public ResponseResult<Room> getRoom(@PathVariable Long id) {
        try {
            Room room = roomService.getRoomById(id);
            if (room == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "房间不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取房间成功", room);
        } catch (Exception e) {
            log.error("获取房间失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取房间失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建房间
     *
     * @param room 房间信息
     * @return 新创建房间的ID
     */
    @PostMapping
    public ResponseResult<Long> createRoom(@RequestBody Room room) {
        try {
            if (room == null || room.getCenterId() == null || room.getRoomNumber() == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "房间信息不完整", null);
            }

            Long id = roomService.createRoom(room);
            if (id != null) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "创建房间成功", id);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建房间失败", null);
        } catch (Exception e) {
            log.error("创建房间失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建房间失败: " + e.getMessage(), null);
        }
    }

    /**
     * 批量创建房间
     *
     * @param rooms 房间列表
     * @return 创建结果
     */
    @PostMapping("/batch")
    public ResponseResult<Void> createRoomsBatch(@RequestBody List<Room> rooms) {
        try {
            if (rooms == null || rooms.isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "房间列表为空", null);
            }

            boolean success = roomService.createRoomsBatch(rooms);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "批量创建房间成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "批量创建房间失败", null);
        } catch (Exception e) {
            log.error("批量创建房间失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "批量创建房间失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新房间
     *
     * @param id 房间ID
     * @param room 房间信息
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateRoom(@PathVariable Long id, @RequestBody Room room) {
        try {
            if (room == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "房间信息为空", null);
            }

            room.setId(id);
            boolean success = roomService.updateRoom(room);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "更新房间成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新房间失败", null);
        } catch (Exception e) {
            log.error("更新房间失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新房间失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除房间
     *
     * @param id 房间ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteRoom(@PathVariable Long id) {
        try {
            boolean success = roomService.deleteRoom(id);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "删除房间成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除房间失败", null);
        } catch (Exception e) {
            log.error("删除房间失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除房间失败: " + e.getMessage(), null);
        }
    }

    /**
     * 统计房间总数
     *
     * @return 房间总数
     */
    @GetMapping("/count")
    public ResponseResult<Integer> countRooms() {
        try {
            int count = roomService.countRooms();
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取房间总数成功", count);
        } catch (Exception e) {
            log.error("获取房间总数失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取房间总数失败: " + e.getMessage(), null);
        }
    }
}

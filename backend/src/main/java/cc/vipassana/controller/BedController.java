package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Allocation;
import cc.vipassana.entity.Bed;
import cc.vipassana.entity.Room;
import cc.vipassana.mapper.AllocationMapper;
import cc.vipassana.mapper.RoomMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 床位视图接口（基于 Room.capacity 动态生成）
 */
@Slf4j
@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor
public class BedController {

    private final RoomMapper roomMapper;
    private final AllocationMapper allocationMapper;

    /**
     * 获取床位列表
     *
     * @param roomId    房间ID（可选）
     * @param sessionId 会期ID（可选，用于标记占用状态）
     */
    @GetMapping
    public ResponseResult<ResponseResult.ListData<Bed>> getBeds(
            @RequestParam(value = "roomId", required = false) Long roomId,
            @RequestParam(value = "sessionId", required = false) Long sessionId) {

        List<Room> rooms = loadRooms(roomId);
        if (rooms.isEmpty()) {
            return success(Collections.emptyList(), "没有匹配的房间");
        }

        Set<String> occupiedBeds = loadOccupiedBeds(sessionId);
        List<Bed> beds = rooms.stream()
            .flatMap(room -> generateBedsForRoom(room, occupiedBeds).stream())
            .collect(Collectors.toList());

        return success(beds, "床位信息（基于房间容量动态生成）");
    }

    /**
     * 兼容接口：床位不再单独维护
     */
    @GetMapping("/{id}")
    public ResponseResult<Bed> getBed(@PathVariable Long id) {
        return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
            "床位信息已整合到 Room/Allocation 表，请使用 /api/beds?roomId=xxx 查询", null);
    }

    @PostMapping
    public ResponseResult<Long> createBed(@RequestBody Bed bed) {
        return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
            "床位信息由房间容量推导，无需单独创建", null);
    }

    @PutMapping("/{id}")
    public ResponseResult<Void> updateBed(@PathVariable Long id, @RequestBody Bed bed) {
        return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
            "床位信息由房间容量推导，无需单独更新", null);
    }

    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteBed(@PathVariable Long id) {
        return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
            "床位信息由房间容量推导，无需单独删除", null);
    }

    private List<Room> loadRooms(Long roomId) {
        if (roomId == null) {
            return roomMapper.selectAll();
        }
        Room room = roomMapper.selectById(roomId);
        return room == null ? Collections.emptyList() : Collections.singletonList(room);
    }

    private Set<String> loadOccupiedBeds(Long sessionId) {
        if (sessionId == null) {
            return Collections.emptySet();
        }
        List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
        return allocations.stream()
            .map(a -> a.getRoomId() + "-" + a.getBedNumber())
            .collect(Collectors.toSet());
    }

    private List<Bed> generateBedsForRoom(Room room, Set<String> occupiedBeds) {
        List<Bed> beds = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 1; i <= room.getCapacity(); i++) {
            Bed bed = Bed.builder()
                .id(room.getId() * 100 + i)
                .roomId(room.getId())
                .bedNumber(i)
                .position(null)
                .createdAt(room.getCreatedAt() != null ? room.getCreatedAt() : now)
                .updatedAt(room.getUpdatedAt() != null ? room.getUpdatedAt() : now)
                .status(occupiedBeds.contains(room.getId() + "-" + i) ? "OCCUPIED" : "AVAILABLE")
                .build();
            beds.add(bed);
        }
        return beds;
    }

    private ResponseResult<ResponseResult.ListData<Bed>> success(List<Bed> data, String message) {
        return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), message, new ResponseResult.ListData<>(data));
    }
}

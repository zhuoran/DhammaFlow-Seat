package cc.vipassana.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.alibaba.excel.util.ListUtils;
import cc.vipassana.dto.RoomBedImportDTO;
import cc.vipassana.entity.Room;
import cc.vipassana.mapper.RoomMapper;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * EasyExcel 房间导入监听器
 * 处理房间的批量导入
 *
 * Excel 列格式: 楼层、房间号、房间类型、性别区域、容量(床位数)、备注
 *
 * 核心逻辑:
 * 1. 读取房间信息
 * 2. 批量保存房间
 *
 * 注意: 床位不再单独存储，通过 Room.capacity 字段推导
 */
@Slf4j
public class RoomBedImportListener implements ReadListener<RoomBedImportDTO> {

    /**
     * 批量处理数据的条数
     */
    private static final int BATCH_COUNT = 100;

    private List<RoomBedImportDTO> cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
    private final RoomMapper roomMapper;
    private final Long centerId;
    private int successCount = 0;
    private int failureCount = 0;
    private Map<String, Long> roomIdMap = new HashMap<>();

    public RoomBedImportListener(RoomMapper roomMapper, Long centerId) {
        this.roomMapper = roomMapper;
        this.centerId = centerId;
    }

    /**
     * 每读一行数据就会调用这个方法
     */
    @Override
    public void invoke(RoomBedImportDTO data, AnalysisContext context) {
        // 验证数据
        if (!validateData(data)) {
            failureCount++;
            log.warn("房间数据验证失败: {}", data.getRoomNumber());
            return;
        }

        cachedDataList.add(data);

        // 达到批处理条数时保存一次
        if (cachedDataList.size() >= BATCH_COUNT) {
            processBatch();
            cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
        }
    }

    /**
     * 所有数据都读取完成后调用这个方法
     */
    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        // 保存剩余数据
        if (!cachedDataList.isEmpty()) {
            processBatch();
        }
        log.info("Excel 数据读取完成 - 成功: {} 条房间, 失败: {} 条", successCount, failureCount);
    }

    /**
     * 发生异常时调用此方法
     */
    @Override
    public void onException(Exception exception, AnalysisContext context) {
        log.error("Excel 读取异常: ", exception);
    }

    /**
     * 验证房间数据
     */
    private boolean validateData(RoomBedImportDTO data) {
        // 房间号必填
        if (data.getRoomNumber() == null || data.getRoomNumber().trim().isEmpty()) {
            log.warn("房间号不能为空");
            return false;
        }

        // 容量必填且有效
        if (data.getCapacity() == null || data.getCapacity() < 1 || data.getCapacity() > 4) {
            log.warn("容量必须为 1-4: {}", data.getRoomNumber());
            return false;
        }

        // 房间类型必填
        if (data.getRoomType() == null || data.getRoomType().trim().isEmpty()) {
            log.warn("房间类型不能为空: {}", data.getRoomNumber());
            return false;
        }

        return true;
    }

    /**
     * 处理一批房间数据
     * 核心逻辑: 增量导入 - 检查房间是否存在 -> 创建房间
     */
    private void processBatch() {
        if (cachedDataList.isEmpty()) {
            return;
        }

        try {
            List<Room> roomsToCreate = new java.util.ArrayList<>();
            int skippedCount = 0;

            // 检查房间是否已存在，只创建新房间
            for (RoomBedImportDTO dto : cachedDataList) {
                // 检查房间是否已存在
                Room existingRoom = roomMapper.selectByRoomNumber(dto.getRoomNumber());

                if (existingRoom != null) {
                    // 房间已存在，跳过
                    log.warn("房间 {} 已存在，跳过创建", dto.getRoomNumber());
                    skippedCount++;
                } else {
                    // 房间不存在，准备创建
                    Room room = convertToRoom(dto);
                    roomsToCreate.add(room);
                }
            }

            // 批量插入新房间
            if (!roomsToCreate.isEmpty()) {
                roomMapper.insertBatch(roomsToCreate);
                log.info("批量保存房间成功: {} 条", roomsToCreate.size());
            }

            // 统计成功数（只计算真正新创建的房间）
            successCount += roomsToCreate.size();

            // 如果有跳过的房间，记录警告
            if (skippedCount > 0) {
                log.info("本次导入跳过已存在的房间: {} 条", skippedCount);
            }

        } catch (Exception e) {
            failureCount += cachedDataList.size();
            log.error("批量保存房间失败: ", e);
        }
    }

    /**
     * 将 DTO 转换为 Room 实体
     */
    private Room convertToRoom(RoomBedImportDTO dto) {
        Room room = new Room();
        room.setCenterId(centerId);
        room.setRoomNumber(dto.getRoomNumber().trim());
        room.setFloor(parseFloor(dto.getFloor()));
        room.setCapacity(dto.getCapacity());
        room.setRoomType(dto.getRoomType().trim());
        room.setStatus("ENABLED");
        // 设置building字段为默认值 "01楼"（模板中不包含building字段）
        room.setBuilding("01楼");
        // 设置性别区域字段
        String genderArea = dto.getGenderArea();
        room.setGenderArea((genderArea != null && !genderArea.trim().isEmpty()) ? genderArea.trim() : "女");
        room.setNotes(dto.getNotes());

        LocalDateTime now = LocalDateTime.now();
        room.setCreatedAt(now);
        room.setUpdatedAt(now);

        return room;
    }

    /**
     * 解析楼层字符串为数字
     */
    private Integer parseFloor(String floorStr) {
        if (floorStr == null) {
            return 0;
        }

        return switch (floorStr.trim()) {
            case "一楼" -> 1;
            case "二楼" -> 2;
            case "三楼" -> 3;
            case "四楼" -> 4;
            case "五楼" -> 5;
            default -> {
                try {
                    yield Integer.parseInt(floorStr);
                } catch (NumberFormatException e) {
                    log.warn("无法解析楼层: {}", floorStr);
                    yield 0;
                }
            }
        };
    }

    /**
     * 获取导入成功的条数
     */
    public int getSuccessCount() {
        return successCount;
    }

    /**
     * 获取导入失败的条数
     */
    public int getFailureCount() {
        return failureCount;
    }
}

package cc.vipassana.service.allocation;

import cc.vipassana.common.RoomType;
import cc.vipassana.entity.Room;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 房间队列构建器
 * 对应VBA宏中的CBedInfo.getUsableRooms()方法
 * 负责按房间类型筛选并打乱房间顺序
 */
public class RoomQueueBuilder {

    private final List<Room> allRooms;
    private final Random random;

    public RoomQueueBuilder(List<Room> allRooms) {
        this.allRooms = allRooms;
        this.random = new Random();
    }

    /**
     * 构建完整的房间分配队列
     * 按照VBA宏固定顺序：法师房 → 旧生房 → 新生房 → 老人房1 → 老人房2
     *
     * @param genderArea 性别区域 "男"/"女"
     * @return 打乱后的房间队列
     */
    public Queue<Room> buildQueue(String genderArea) {
        List<Room> orderedRooms = new ArrayList<>();

        // 1. 法师房
        orderedRooms.addAll(filterAndShuffle(RoomType.MONK, null, genderArea));

        // 2. 旧生房
        orderedRooms.addAll(filterAndShuffle(RoomType.OLD_STUDENT, null, genderArea));

        // 3. 新生房
        orderedRooms.addAll(filterAndShuffle(RoomType.NEW_STUDENT, null, genderArea));

        // 4. 老人房1
        orderedRooms.addAll(filterAndShuffle(RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_1, genderArea));

        // 5. 老人房2
        orderedRooms.addAll(filterAndShuffle(RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_2, genderArea));

        return new LinkedList<>(orderedRooms);
    }

    /**
     * 筛选并打乱房间
     * 对应VBA宏中的getUsableRooms() + DisruptBed()组合
     *
     * @param roomType 房间类型
     * @param specialTag 特殊标签（可选，用于区分老人房1/2）
     * @param genderArea 性别区域
     * @return 打乱后的房间列表
     */
    private List<Room> filterAndShuffle(String roomType, String specialTag, String genderArea) {
        List<Room> filtered = allRooms.stream()
                .filter(room -> "ENABLED".equals(room.getStatus()))
                .filter(room -> genderArea.equals(room.getGenderArea()))
                .filter(room -> roomType.equals(room.getRoomType()))
                .filter(room -> !Boolean.TRUE.equals(room.getIsReserved()))
                .filter(room -> {
                    // 如果未指定specialTag，匹配所有该类型房间（包括special_tag=null的）
                    if (specialTag == null) {
                        return true;
                    }
                    // 如果指定了specialTag，精确匹配（或者special_tag=null时也算匹配）
                    return specialTag.equals(room.getSpecialTag()) || room.getSpecialTag() == null;
                })
                .collect(Collectors.toList());

        // 打乱顺序（对应VBA的DisruptBed函数）
        Collections.shuffle(filtered, random);

        return filtered;
    }

    /**
     * 设置随机种子（用于测试）
     */
    public void setSeed(long seed) {
        this.random.setSeed(seed);
    }
}

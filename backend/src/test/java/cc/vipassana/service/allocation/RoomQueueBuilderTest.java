package cc.vipassana.service.allocation;

import cc.vipassana.common.RoomType;
import cc.vipassana.entity.Room;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

import static org.junit.jupiter.api.Assertions.*;

class RoomQueueBuilderTest {

    private List<Room> testRooms;

    @BeforeEach
    void setUp() {
        testRooms = new ArrayList<>();

        // 法师房
        testRooms.add(createRoom(1L, "101", RoomType.MONK, null, "男"));
        testRooms.add(createRoom(2L, "102", RoomType.MONK, null, "女"));

        // 旧生房
        testRooms.add(createRoom(3L, "201", RoomType.OLD_STUDENT, null, "男"));
        testRooms.add(createRoom(4L, "202", RoomType.OLD_STUDENT, null, "女"));

        // 新生房
        testRooms.add(createRoom(5L, "301", RoomType.NEW_STUDENT, null, "男"));
        testRooms.add(createRoom(6L, "302", RoomType.NEW_STUDENT, null, "女"));

        // 老人房1
        testRooms.add(createRoom(7L, "401", RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_1, "男"));
        testRooms.add(createRoom(8L, "402", RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_1, "女"));

        // 老人房2
        testRooms.add(createRoom(9L, "501", RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_2, "男"));
        testRooms.add(createRoom(10L, "502", RoomType.ELDERLY, RoomType.SpecialTag.ELDERLY_2, "女"));
    }

    @Test
    void testBuildQueue_Male() {
        RoomQueueBuilder builder = new RoomQueueBuilder(testRooms);
        builder.setSeed(12345L); // 固定种子以获得可预测的结果

        Queue<Room> queue = builder.buildQueue("男");

        // 应该只包含男性房间
        assertNotNull(queue);
        assertEquals(5, queue.size()); // 5个男性房间

        // 验证房间类型顺序
        List<Room> rooms = new ArrayList<>(queue);
        assertEquals(RoomType.MONK, rooms.get(0).getRoomType());
        assertEquals(RoomType.OLD_STUDENT, rooms.get(1).getRoomType());
        assertEquals(RoomType.NEW_STUDENT, rooms.get(2).getRoomType());
        assertEquals(RoomType.ELDERLY, rooms.get(3).getRoomType());
        assertEquals(RoomType.SpecialTag.ELDERLY_1, rooms.get(3).getSpecialTag());
        assertEquals(RoomType.ELDERLY, rooms.get(4).getRoomType());
        assertEquals(RoomType.SpecialTag.ELDERLY_2, rooms.get(4).getSpecialTag());
    }

    @Test
    void testBuildQueue_Female() {
        RoomQueueBuilder builder = new RoomQueueBuilder(testRooms);
        builder.setSeed(12345L);

        Queue<Room> queue = builder.buildQueue("女");

        // 应该只包含女性房间
        assertNotNull(queue);
        assertEquals(5, queue.size()); // 5个女性房间

        // 验证所有房间都是女性区域
        queue.forEach(room -> assertEquals("女", room.getGenderArea()));
    }

    @Test
    void testBuildQueue_FilterDisabledRooms() {
        // 添加一个禁用的房间
        testRooms.add(createRoom(11L, "999", RoomType.MONK, null, "男", "DISABLED"));

        RoomQueueBuilder builder = new RoomQueueBuilder(testRooms);
        Queue<Room> queue = builder.buildQueue("男");

        // 禁用的房间不应该出现在队列中
        assertEquals(5, queue.size());
    }

    @Test
    void testBuildQueue_FilterReservedRooms() {
        // 添加一个预留房间
        Room reservedRoom = createRoom(12L, "888", RoomType.MONK, null, "男");
        reservedRoom.setIsReserved(true);
        testRooms.add(reservedRoom);

        RoomQueueBuilder builder = new RoomQueueBuilder(testRooms);
        Queue<Room> queue = builder.buildQueue("男");

        // 预留房间不应该出现在队列中
        assertEquals(5, queue.size());
    }

    private Room createRoom(Long id, String roomNumber, String roomType, String specialTag, String genderArea) {
        return createRoom(id, roomNumber, roomType, specialTag, genderArea, "ENABLED");
    }

    private Room createRoom(Long id, String roomNumber, String roomType, String specialTag, String genderArea, String status) {
        return Room.builder()
                .id(id)
                .roomNumber(roomNumber)
                .roomType(roomType)
                .specialTag(specialTag)
                .genderArea(genderArea)
                .capacity(4)
                .status(status)
                .isReserved(false)
                .build();
    }
}

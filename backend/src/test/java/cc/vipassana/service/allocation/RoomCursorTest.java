package cc.vipassana.service.allocation;

import cc.vipassana.common.RoomType;
import cc.vipassana.entity.Room;
import org.junit.jupiter.api.Test;

import java.util.LinkedList;
import java.util.Queue;

import static org.junit.jupiter.api.Assertions.*;

class RoomCursorTest {

    @Test
    void testNextAvailableRoom_SingleRoom() {
        Queue<Room> queue = new LinkedList<>();
        queue.add(createRoom(1L, "101", 2));

        RoomCursor cursor = new RoomCursor(queue);

        assertTrue(cursor.hasNext());

        Room room1 = cursor.nextAvailableRoom();
        assertNotNull(room1);
        assertEquals(1L, room1.getId());

        Room room2 = cursor.nextAvailableRoom();
        assertNotNull(room2);
        assertEquals(1L, room2.getId()); // 同一房间

        assertFalse(cursor.hasNext()); // 房间已满
        assertNull(cursor.nextAvailableRoom());
    }

    @Test
    void testNextAvailableRoom_MultipleRooms() {
        Queue<Room> queue = new LinkedList<>();
        queue.add(createRoom(1L, "101", 2));
        queue.add(createRoom(2L, "102", 2));

        RoomCursor cursor = new RoomCursor(queue);

        assertEquals(1L, cursor.nextAvailableRoom().getId());
        assertEquals(1L, cursor.nextAvailableRoom().getId());
        assertEquals(2L, cursor.nextAvailableRoom().getId()); // 切换到第二个房间
        assertEquals(2L, cursor.nextAvailableRoom().getId());

        assertFalse(cursor.hasNext());
    }

    @Test
    void testGetRemainingCapacity() {
        Queue<Room> queue = new LinkedList<>();
        queue.add(createRoom(1L, "101", 3));
        queue.add(createRoom(2L, "102", 2));

        RoomCursor cursor = new RoomCursor(queue);

        assertEquals(5, cursor.getRemainingCapacity()); // 3 + 2

        cursor.nextAvailableRoom();
        assertEquals(4, cursor.getRemainingCapacity()); // 2 + 2

        cursor.nextAvailableRoom();
        cursor.nextAvailableRoom();
        assertEquals(2, cursor.getRemainingCapacity()); // 0 + 2
    }

    @Test
    void testResetCurrentRoom() {
        Queue<Room> queue = new LinkedList<>();
        queue.add(createRoom(1L, "101", 3));
        queue.add(createRoom(2L, "102", 2));

        RoomCursor cursor = new RoomCursor(queue);

        cursor.nextAvailableRoom();
        cursor.resetCurrentRoom();

        // 强制切换到下一个房间
        assertEquals(2L, cursor.nextAvailableRoom().getId());
    }

    private Room createRoom(Long id, String roomNumber, int capacity) {
        return Room.builder()
                .id(id)
                .roomNumber(roomNumber)
                .roomType(RoomType.NEW_STUDENT)
                .capacity(capacity)
                .genderArea("男")
                .status("ENABLED")
                .build();
    }
}

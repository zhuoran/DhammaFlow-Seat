package cc.vipassana.service.allocation;

import cc.vipassana.entity.Room;

import java.util.Queue;

/**
 * 房间游标
 * 管理房间队列的遍历和床位分配
 * 对应VBA宏中通过索引遍历房间并分配床位的逻辑
 */
public class RoomCursor {

    private final Queue<Room> roomQueue;
    private Room currentRoom;
    private int currentOccupancy;  // 当前房间已分配人数

    public RoomCursor(Queue<Room> roomQueue) {
        this.roomQueue = roomQueue;
        this.currentRoom = null;
        this.currentOccupancy = 0;
    }

    /**
     * 获取下一个可用床位的房间
     *
     * @return 可用房间，如果没有则返回null
     */
    public Room nextAvailableRoom() {
        // 如果当前房间还有空床位，继续使用
        if (currentRoom != null && currentOccupancy < currentRoom.getCapacity()) {
            currentOccupancy++;
            return currentRoom;
        }

        // 当前房间已满，获取下一个房间
        currentRoom = roomQueue.poll();
        if (currentRoom != null) {
            currentOccupancy = 1;
            return currentRoom;
        }

        return null;
    }

    /**
     * 检查是否还有可用房间
     */
    public boolean hasNext() {
        return (currentRoom != null && currentOccupancy < currentRoom.getCapacity())
                || !roomQueue.isEmpty();
    }

    /**
     * 获取剩余可用床位总数
     */
    public int getRemainingCapacity() {
        int remaining = 0;

        // 当前房间剩余床位
        if (currentRoom != null) {
            remaining += currentRoom.getCapacity() - currentOccupancy;
        }

        // 队列中所有房间的容量
        for (Room room : roomQueue) {
            remaining += room.getCapacity();
        }

        return remaining;
    }

    /**
     * 重置当前房间（强制切换到下一个房间）
     */
    public void resetCurrentRoom() {
        currentRoom = null;
        currentOccupancy = 0;
    }
}

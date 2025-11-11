import type { Room } from "@/types/domain";

export interface FloorRoomGroup {
  floor: number;
  evenRooms: Room[];
  oddRooms: Room[];
}

export function getRoomNumber(roomNumber: string): number {
  const match = roomNumber?.match?.(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function groupRoomsByFloor(rooms: Room[]): FloorRoomGroup[] {
  const floorMap = rooms.reduce<Map<number, Room[]>>((map, room) => {
    const floorRooms = map.get(room.floor) ?? [];
    floorRooms.push(room);
    map.set(room.floor, floorRooms);
    return map;
  }, new Map());

  return Array.from(floorMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([floor, floorRooms]) => {
      const evenRooms = floorRooms
        .filter((room) => getRoomNumber(room.roomNumber) % 2 === 0)
        .sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
      const oddRooms = floorRooms
        .filter((room) => getRoomNumber(room.roomNumber) % 2 !== 0)
        .sort((a, b) => getRoomNumber(a.roomNumber) - getRoomNumber(b.roomNumber));
      return { floor, evenRooms, oddRooms };
    });
}


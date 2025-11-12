import type { Room } from "@/types/domain";
import type { FloorRoomGroup } from "./room-layout";

export type ParityKey = "even" | "odd";

export interface FloorRenderSection {
  key: ParityKey;
  label: string;
  rooms: Room[];
}

export interface FloorRenderPlan {
  floor: number;
  sections: FloorRenderSection[];
}

/**
 * 默认的房间可视化方案：同一层楼按照房号奇偶拆分两条走廊（阳面/阴面），
 * 未来若需要针对某中心定制，只需替换该函数即可。
 */
export function buildParityRenderPlan(groups: FloorRoomGroup[]): FloorRenderPlan[] {
  return groups.map((group) => {
    const sections: FloorRenderSection[] = [
      {
        key: "even",
        label: "朝南",
        rooms: group.evenRooms,
      },
      {
        key: "odd",
        label: "朝北",
        rooms: group.oddRooms,
      },
    ].filter((section) => section.rooms.length > 0);
    return { floor: group.floor, sections };
  });
}

package cc.vipassana.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 房间配置 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomConfigDto {
    /** 中心 ID */
    private Integer centerId;

    /** 中心名称 */
    private String centerName;

    /** 房间总数 */
    private Integer totalRooms;

    /** 描述 */
    private String description;

    /** 楼号配置 */
    private List<BuildingDto> buildings;

    /** 房间列表 */
    private List<RoomItemDto> rooms;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BuildingDto {
        /** 楼号代码 */
        private String code;

        /** 楼号名称 */
        private String name;

        /** 楼层数 */
        private Integer floors;

        /** 该楼房间数 */
        private Integer roomsCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomItemDto {
        /** 房号 */
        private String number;

        /** 楼号 */
        private String building;

        /** 楼层 */
        private Integer floor;

        /** 容量 (1 或 2) */
        private Integer capacity;

        /** 房间类型 */
        private String type;

        /** 状态 */
        private String status;

        /** 是否预留 */
        private Boolean reserved;

        /** 预留用途 */
        private String reservedFor;

        /** 备注 */
        private String notes;
    }
}

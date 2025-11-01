package cc.vipassana.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 禅堂配置 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeditationHallConfigDto {
    /** 中心 ID */
    private Integer centerId;

    /** 中心名称 */
    private String centerName;

    /** 描述 */
    private String description;

    /** 禅堂列表 */
    private List<HallRegionDto> meditationHalls;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HallRegionDto {
        /** 区域代码 */
        private String code;

        /** 区域名称 */
        private String name;

        /** 性别类型: F(女) / M(男) / mixed(混合) */
        private String genderType;

        /** 描述 */
        private String description;

        /** 区域宽度 (列数) */
        private Integer regionWidth;

        /** 行数自动计算 */
        private Boolean autoRows;

        /** 最大行数 */
        private Integer maxRows;

        /** 座位编号方式: sequential / odd / even */
        private String numberingType;

        /** 座位号前缀 */
        private String seatPrefix;

        /** 法师座位配置 */
        private MonkSeatsDto monkSeats;

        /** 是否预留第一行 */
        private Boolean reserveFirstRow;

        /** 前置保留列数 */
        private Integer reserveFrontColumns;

        /** 备注 */
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonkSeatsDto {
        /** 起始位置 */
        private String startPosition;

        /** 最多法师数 */
        private Integer maxCount;

        /** 法师座位前缀 */
        private String prefix;

        /** 是否垂直排列 */
        private Boolean vertical;
    }
}

package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 禅堂配置实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeditationHallConfig {
    private Long id;
    private Long centerId;                 // 所属禅修中心 - 新增
    private Long sessionId;                // 期次ID
    private String hallName;               // 禅堂名称
    private String regionName;             // 区域名称 (如"A区"、"B区") - 新增
    private String regionCode;             // 区域代码 (如"A"、"B") - 新增
    private String validArea;              // 有效区域
    private String beginCell;              // 起始单元格
    private Integer rowOffset;             // 行偏移
    private Integer colOffset;             // 列偏移
    private Integer maxRows;               // 最大行数
    private Integer maxCols;               // 最大列数
    private Integer regionWidth;           // 区域宽度（列数，如4或10） - 新增
    private Integer regionRows;            // 区域行数（0=自动计算） - 新增
    private Integer usedRows;              // 已使用行数
    private Integer usedCols;              // 已使用列数
    private Boolean isAutoWidth;           // 宽度是否自动计算 - 新增
    private Boolean isAutoRows;            // 行数是否自动计算 - 新增
    private String numberingType;          // 编号类型：SEQUENTIAL/ODD/EVEN
    private String seatNumberPrefix;       // 座位编号前缀
    private String seatPrefix;             // 座位号前缀（别名）- 新增
    private Boolean genderSeparated;       // 是否需要性别分离 - 新增
    private String genderType;             // 性别类型：F=女众/M=男众/mixed=混合 - 新增
    private String monkStartCell;          // 法师起始单元格
    private Integer monkMaxCount;          // 法师最大数量
    private String monkSeatPrefix;         // 法师座位前缀
    private String oldStudentReservedList; // 旧生预留座位列表
    private String dhammaWorkerArea1;      // 法工区域1
    private String dhammaWorkerArea2;      // 法工区域2
    private String layoutConfig;           // 新的布局配置(JSON)
    private String supportedGenders;       // 支持的性别集合，逗号分隔
    private String hallUsage;              // 禅堂使用模式：SINGLE/DUAL/MIXED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

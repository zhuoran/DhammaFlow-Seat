package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 禅堂座位实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeditationSeat {
    private Long id;
    private Long sessionId;              // 期次ID
    private Long centerId;               // 所属中心ID - 新增
    private Long hallConfigId;           // 禅堂配置ID - 新增
    private Long hallId;                 // 禅堂ID
    private String seatNumber;           // 座位号
    private Long studentId;              // 学员ID
    private String bedCode;              // 床位代码
    private String seatType;             // 座位类型：MONK/STUDENT/WORKER
    private String status;               // 状态：available/allocated/reserved - 新增
    private Boolean isOldStudent;        // 是否旧生座位
    private String ageGroup;             // 年龄分段 (如"18-30"、"30-40") - 新增
    private String gender;               // 性别 (M=男众, F=女众) - 新增
    private String regionCode;           // 所属区域 (如"A"、"B") - 新增
    private Integer rowIndex;            // 行索引
    private Integer colIndex;            // 列索引
    private Integer rowPosition;         // 在性别分组内的行位置 - 新增
    private Integer colPosition;         // 在性别分组内的列位置 - 新增
    private Boolean isWithCompanion;     // 是否有同伴 - 新增
    private Long companionSeatId;        // 同伴座位ID - 新增
    private String companionName;        // 同伴姓名（前端提示用，非持久化）
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

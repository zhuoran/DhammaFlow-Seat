package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 房间实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    private Long id;
    private Long centerId;            // 所属禅修中心
    private String roomNumber;        // 房号
    private String building;          // 楼号
    private Integer floor;            // 楼层
    private Integer capacity;         // 容量
    private String roomType;          // 房间类型
    private String status;            // 状态：ENABLED/DISABLED
    private String genderArea;        // 性别区域：男/女
    private Boolean isReserved;       // 是否预留
    private String reservedFor;       // 预留给谁
    private String specialTag;        // 特殊标签(如"老人1"/"老人2")
    private String notes;             // 备注
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 床位实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bed {
    private Long id;
    private Long roomId;              // 房间ID
    private Integer bedNumber;        // 房间内床号
    private String position;          // 位置：下铺/上铺
    private String status;            // 动态状态：AVAILABLE/OCCUPIED
    // status 字段已删除：床位是否被占用通过 Allocation 表推导，不再冗余存储
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

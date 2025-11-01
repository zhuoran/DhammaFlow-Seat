package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 房间分配实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allocation {
    private Long id;
    private Long sessionId;           // 期次ID
    private Long studentId;           // 学员ID
    private Long bedId;               // 床位ID
    private String allocationType;    // 分配类型：AUTOMATIC/MANUAL
    private String allocationReason;  // 分配原因
    private Boolean isTemporary;      // 是否暂存
    private Boolean conflictFlag;     // 是否有冲突
    private String conflictReason;    // 冲突原因
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

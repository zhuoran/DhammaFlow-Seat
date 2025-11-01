package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 操作日志实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationLog {
    private Long id;
    private Long userId;              // 用户ID
    private String operationType;     // 操作类型
    private String entityType;        // 实体类型
    private Long entityId;            // 实体ID
    private String changeBefore;      // 变更前数据
    private String changeAfter;       // 变更后数据
    private LocalDateTime createdAt;
}

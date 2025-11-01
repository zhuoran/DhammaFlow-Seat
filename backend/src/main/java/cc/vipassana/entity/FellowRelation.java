package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 同伴关系实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FellowRelation {
    private Long id;
    private Long sessionId;           // 期次ID
    private Integer fellowGroupId;    // 同伴组ID
    private Long primaryStudentId;    // 主学员ID
    private String relatedStudentIds; // 关联学员ID列表（逗号分隔）
    private Boolean separationFlag;   // 是否分离
    private String separationReason;  // 分离原因
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

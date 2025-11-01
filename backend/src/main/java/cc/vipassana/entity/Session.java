package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 课程期次实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {
    private Long id;
    private Long centerId;             // 所属禅修中心 - 新增
    private String sessionCode;        // 期次代码
    private String courseType;         // 课程类型
    private LocalDate startDate;       // 开始日期
    private LocalDate endDate;         // 结束日期
    private Integer expectedStudents;  // 预期学员数
    private String status;             // 状态：PLANNING/RUNNING/COMPLETED
    private String notes;              // 备注
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

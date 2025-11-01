package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 禅修中心实体类
 * 代表系统中的一个禅修中心
 * 所有房间、禅堂、课程期次都属于某个具体的中心
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Center {
    private Long id;
    private String centerName;        // 中心名称 - 唯一
    private String address;           // 地址
    private String contactPhone;      // 联系电话
    private String contactPerson;     // 联系人
    private String centerDescription; // 中心简介
    private String status;            // 状态：OPERATING/PAUSED/CLOSED
    private String notes;             // 备注
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ============ 业务方法 ============

    /**
     * 判断中心是否运营中
     */
    public boolean isOperating() {
        return "OPERATING".equalsIgnoreCase(status);
    }

    /**
     * 获取状态显示名称
     */
    public String getStatusDisplayName() {
        if (status == null) return "未知";
        return switch (status.toUpperCase()) {
            case "OPERATING" -> "运营中";
            case "PAUSED" -> "暂停";
            case "CLOSED" -> "已关闭";
            default -> "未知";
        };
    }
}

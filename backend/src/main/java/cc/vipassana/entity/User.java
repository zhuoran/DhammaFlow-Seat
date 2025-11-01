package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private Long id;
    private String username;         // 用户名
    private String password;         // 密码（加密）
    private String email;            // 邮箱
    private String role;             // 角色：ADMIN/USER/VIEWER
    private String status;           // 状态：ACTIVE/INACTIVE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package cc.vipassana.dto.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 禅修中心配置 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CenterConfigDto {
    /** 中心 ID */
    private Integer id;

    /** 中心名称 */
    private String name;

    /** 地址 */
    private String address;

    /** 联系人 */
    private String contactPerson;

    /** 联系电话 */
    private String contactPhone;

    /** 中心描述 */
    private String description;

    /** 状态: OPERATING / PAUSED / CLOSED */
    private String status;

    /** 房间配置文件 */
    private String roomsFile;

    /** 禅堂配置文件 */
    private String hallsFile;
}

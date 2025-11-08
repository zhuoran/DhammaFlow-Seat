package cc.vipassana.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 课程设置DTO
 * MVP 版本：仅包含核心必需字段
 *
 * 课程配置包括：
 * - 讲师信息（支持双性课程双师配置）
 * - 课程时间和地点
 * - 禅堂配置（A/B区域分离）
 * - 座位编号方式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionConfigDTO {

    // 讲师信息
    private String teacher1Name;      // 讲师1（必需）
    private String teacher2Name;      // 讲师2（可选，用于双性课程）

    // 课程基本信息
    private LocalDate courseDate;     // 课程开始日期
    private String location;          // 课程地点

    // 禅堂配置
    private Integer meditationHallAWidth;   // 禅堂A区域宽度（座位数/行）
    private Integer meditationHallARows;    // 禅堂A区域行数
    private Integer meditationHallBWidth;   // 禅堂B区域宽度（座位数/行）
    private Integer meditationHallBRows;    // 禅堂B区域行数

    // 课程类型配置
    private String courseGenderType;  // 课程性别类型：单性(single) or 双性(co-ed)

    // 座位编号方式
    private String seatNumberingType; // 座位编号方式：顺序(sequential)/奇数(odd)/偶数(even)

}

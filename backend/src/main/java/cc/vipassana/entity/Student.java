package cc.vipassana.entity;

import lombok.*;
import java.time.LocalDateTime;

/**
 * 学员实体类
 * MyBatis版本 - 不需要JPA注解
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {
    private Long id;
    private Long sessionId;
    private String studentNumber;           // 学号
    private String name;                    // 姓名
    private String idCard;                  // 身份证号
    private Integer age;                    // 年龄
    private String gender;                  // 性别 (M=男众, F=女众) - 新增
    private String ageGroup;                // 年龄分段 (如"18-30", "30-40") - 新增 - 计算字段
    private String studentType;             // 学员类型 (monk=法师, old_student=旧生, new_student=新生) - 新增
    private String city;                    // 城市
    private String phone;                   // 电话
    private Integer studyTimes;             // 修学次数（总参修次数）
    private Integer course10dayTimes;       // 10日课程参修次数
    private Integer course4mindfulnessTimes;// 四念住课程参修次数
    private Integer course20dayTimes;       // 20日课程参修次数
    private Integer course30dayTimes;       // 30日课程参修次数
    private Integer course45dayTimes;       // 45日课程参修次数
    private Integer serviceTimes;           // 服务次数
    private String fellowList;              // 同伴列表（逗号分隔）
    private Integer fellowGroupId;          // 同伴组ID
    private String specialNotes;            // 特殊备注
    private String practice;                // 练习（每周时长）
    private String idAddress;               // 证件地址
    private String willingToServe;          // 是否愿意服务
    private String emergencyPhone;          // 直系亲属电话
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ============ 业务方法 ============

    /**
     * 判断是否为法师
     */
    public boolean isMonk() {
        return name != null && name.startsWith("法");
    }

    /**
     * 判断是否为旧生
     */
    public boolean isOldStudent() {
        return studyTimes != null && studyTimes > 0;
    }

    /**
     * 获取学员分类
     */
    public String getCategory() {
        if (isMonk()) return "法师";
        if (isOldStudent()) return "旧生";
        return "新生";
    }

    /**
     * 获取优先级（1=法师，2=旧生，3=新生）
     */
    public int getPriority() {
        if (isMonk()) return 1;
        if (isOldStudent()) return 2;
        return 3;
    }

    /**
     * 计算各课程参修次数合计
     * 包括：10日、四念住、20日、30日、45日课程的参修次数合计
     * 不包括服务次数和总修学次数
     */
    public int getTotalCourseTimes() {
        int total = 0;
        if (course10dayTimes != null) total += course10dayTimes;
        if (course4mindfulnessTimes != null) total += course4mindfulnessTimes;
        if (course20dayTimes != null) total += course20dayTimes;
        if (course30dayTimes != null) total += course30dayTimes;
        if (course45dayTimes != null) total += course45dayTimes;
        return total;
    }

    /**
     * 获取课程类型和参修次数的描述
     * 例如：10日(2次)、四念住(1次)、20日(0次)...
     */
    public String getCourseDescription() {
        StringBuilder sb = new StringBuilder();
        if (course10dayTimes != null && course10dayTimes > 0) {
            sb.append("10日(").append(course10dayTimes).append("次) ");
        }
        if (course4mindfulnessTimes != null && course4mindfulnessTimes > 0) {
            sb.append("四念住(").append(course4mindfulnessTimes).append("次) ");
        }
        if (course20dayTimes != null && course20dayTimes > 0) {
            sb.append("20日(").append(course20dayTimes).append("次) ");
        }
        if (course30dayTimes != null && course30dayTimes > 0) {
            sb.append("30日(").append(course30dayTimes).append("次) ");
        }
        if (course45dayTimes != null && course45dayTimes > 0) {
            sb.append("45日(").append(course45dayTimes).append("次) ");
        }
        if (serviceTimes != null && serviceTimes > 0) {
            sb.append("服务(").append(serviceTimes).append("次)");
        }
        return sb.toString().trim();
    }

    /**
     * 根据年龄计算年龄分段
     * 分段规则：18-30, 30-40, 40-55, 60+
     */
    public String calculateAgeGroup() {
        if (age == null) return null;
        if (age < 18) return "18以下";
        if (age < 30) return "18-30";
        if (age < 40) return "30-40";
        if (age < 55) return "40-55";
        return "55+";
    }

    /**
     * 获取性别显示名称
     */
    public String getGenderDisplayName() {
        if (gender == null) return "未知";
        return "M".equalsIgnoreCase(gender) ? "男众" : "F".equalsIgnoreCase(gender) ? "女众" : "未知";
    }
}

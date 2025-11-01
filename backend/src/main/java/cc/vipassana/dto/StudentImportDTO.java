package cc.vipassana.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.*;

/**
 * 学员导入DTO - 用于 EasyExcel 绑定
 * 统一格式（Sheet1和Sheet2）：
 * 列0-5: 编号, 姓名, 身份证号码, 年龄, 城市, 手机 (6列)
 * 列6-11: 课程次数(总)、10日、四念住、20日、30日、45日、服务 (6列)
 * 列12-17: 练习、同期人员、是否愿服务、证件地址、居住地址、直系亲属电话 (6列)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentImportDTO {

    /**
     * 编号 (列0, 可选)
     */
    @ExcelProperty(index = 0)
    private String number;

    /**
     * 姓名 (列B/Index 1, 必填)
     */
    @ExcelProperty(index = 1)
    private String name;

    /**
     * 身份证号码 (列C/Index 2, 可选)
     */
    @ExcelProperty(index = 2)
    private String idCard;

    /**
     * 年龄 (列D/Index 3, 必填)
     */
    @ExcelProperty(index = 3)
    private Integer age;

    /**
     * 城市 (列E/Index 4, 可选)
     */
    @ExcelProperty(index = 4)
    private String city;

    /**
     * 手机 (列F/Index 5, 可选)
     */
    @ExcelProperty(index = 5)
    private String phone;

    /**
     * 10日课程参修次数 (列G/Index 6)
     */
    @ExcelProperty(index = 6)
    private Integer course10dayTimes;

    /**
     * 四念住课程参修次数 (列H/Index 7)
     */
    @ExcelProperty(index = 7)
    private Integer course4mindfulnessTimes;

    /**
     * 20日课程参修次数 (列I/Index 8)
     */
    @ExcelProperty(index = 8)
    private Integer course20dayTimes;

    /**
     * 30日课程参修次数 (列J/Index 9)
     */
    @ExcelProperty(index = 9)
    private Integer course30dayTimes;

    /**
     * 45日课程参修次数 (列K/Index 10)
     */
    @ExcelProperty(index = 10)
    private Integer course45dayTimes;

    /**
     * 服务次数 (列L/Index 11)
     */
    @ExcelProperty(index = 11)
    private Integer serviceTimes;

    /**
     * 练习（每周时长）(列M/Index 12)
     */
    @ExcelProperty(index = 12)
    private String practice;

    /**
     * 同期人员 (列N/Index 13)
     */
    @ExcelProperty(index = 13)
    private String fellowList;

    /**
     * 是否愿意服务 (列O/Index 14)
     */
    @ExcelProperty(index = 14)
    private String willingToServe;

    /**
     * 证件地址 (列P/Index 15)
     */
    @ExcelProperty(index = 15)
    private String idAddress;

    /**
     * 居住地址 (列Q/Index 16)
     */
    @ExcelProperty(index = 16)
    private String residenceAddress;

    /**
     * 直系亲属电话 (列R/Index 17)
     */
    @ExcelProperty(index = 17)
    private String emergencyPhone;
}

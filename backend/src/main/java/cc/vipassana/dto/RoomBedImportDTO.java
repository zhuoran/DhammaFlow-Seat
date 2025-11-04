package cc.vipassana.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * 房间床位导入 DTO
 * 对应 Excel 模板中的每一行数据
 */
@Data
public class RoomBedImportDTO {

    /**
     * 楼层: 一楼/二楼/三楼
     */
    @ExcelProperty(index = 0)
    private String floor;

    /**
     * 房间号: 如 B101、A216
     */
    @ExcelProperty(index = 1)
    private String roomNumber;

    /**
     * 房间类型: 义工房/学员房/老师房/其他
     */
    @ExcelProperty(index = 2)
    private String roomType;

    /**
     * 性别区域: 男/女
     */
    @ExcelProperty(index = 3)
    private String genderArea;

    /**
     * 容量(床位数): 1-4
     */
    @ExcelProperty(index = 4)
    private Integer capacity;

    /**
     * 备注
     */
    @ExcelProperty(index = 5)
    private String notes;
}

package cc.vipassana.controller;

import com.alibaba.excel.EasyExcel;
import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.dto.RoomBedImportDTO;
import cc.vipassana.listener.RoomBedImportListener;
import cc.vipassana.mapper.RoomMapper;
import cc.vipassana.mapper.BedMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 数据导入控制器
 * 处理房间、床位、学员等数据的批量导入
 */
@Slf4j
@RestController
@RequestMapping("/api/import")
public class ImportController {

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private BedMapper bedMapper;

    /**
     * 导入房间和床位数据
     *
     * @param file 上传的 Excel 文件
     * @param centerId 禅修中心ID
     * @return 导入结果统计
     */
    @PostMapping("/rooms-beds")
    public ResponseResult<Map<String, Object>> importRoomsAndBeds(
            @RequestParam("file") MultipartFile file,
            @RequestParam("centerId") Long centerId) {

        // 参数验证
        if (file == null || file.isEmpty()) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "请上传 Excel 文件",
                    null
            );
        }

        if (centerId == null || centerId <= 0) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "禅修中心ID不能为空",
                    null
            );
        }

        // 检查文件格式
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "只支持 .xlsx 或 .xls 格式的文件",
                    null
            );
        }

        try {
            // 创建监听器
            RoomBedImportListener listener = new RoomBedImportListener(roomMapper, bedMapper, centerId);

            // 读取 Excel 文件
            // 从第 12 行开始读取数据（跳过标题和说明）
            InputStream inputStream = file.getInputStream();
            EasyExcel.read(inputStream, RoomBedImportDTO.class, listener)
                    .headRowNumber(12)  // 设置表头行数
                    .doReadAll();

            // 准备响应数据
            Map<String, Object> result = new HashMap<>();
            result.put("successCount", listener.getSuccessCount());
            result.put("failureCount", listener.getFailureCount());
            result.put("totalCount", listener.getSuccessCount() + listener.getFailureCount());
            result.put("message", String.format(
                    "导入完成！成功: %d 条房间, 失败: %d 条",
                    listener.getSuccessCount(),
                    listener.getFailureCount()
            ));

            log.info("房间床位导入完成 - 成功: {}, 失败: {}",
                    listener.getSuccessCount(),
                    listener.getFailureCount());

            return new ResponseResult<>(
                    SystemErrorCode.SUCCESS.getCode(),
                    "房间床位导入成功",
                    result
            );

        } catch (Exception e) {
            log.error("导入房间床位失败", e);
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "导入失败: " + e.getMessage(),
                    null
            );
        }
    }

    /**
     * 获取导入模板下载链接
     * 返回模板文件的相对路径
     */
    @GetMapping("/template")
    public ResponseResult<Map<String, String>> getImportTemplate() {
        try {
            Map<String, String> result = new HashMap<>();
            result.put("templateFile", "/templates/房间床位导入模板.xlsx");
            result.put("description", "请按照模板格式填写房间信息，然后上传导入");
            return new ResponseResult<>(
                    SystemErrorCode.SUCCESS.getCode(),
                    "模板获取成功",
                    result
            );
        } catch (Exception e) {
            log.error("获取模板失败", e);
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取模板失败: " + e.getMessage(),
                    null
            );
        }
    }
}

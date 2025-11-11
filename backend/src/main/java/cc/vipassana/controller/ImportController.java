package cc.vipassana.controller;

import com.alibaba.excel.EasyExcel;
import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.dto.RoomBedImportDTO;
import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.listener.RoomBedImportListener;
import cc.vipassana.mapper.RoomMapper;
import cc.vipassana.service.StudentImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
    private StudentImportService studentImportService;

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
            // 创建监听器（床位不再单独存储，通过 Room.capacity 推导）
            RoomBedImportListener listener = new RoomBedImportListener(roomMapper, centerId);

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

    /**
     * 学员导入 - 预检查阶段
     * 识别新学员 vs 重复学员（防重复导入）
     *
     * @param file 上传的 Excel 文件
     * @param sessionId 课程ID
     * @return 预检查结果：新学员列表 + 重复学员列表
     */
    @PostMapping("/students/precheck")
    public ResponseResult<Map<String, Object>> precheckStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sessionId") Long sessionId) {

        // 参数验证
        if (file == null || file.isEmpty()) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "请上传 Excel 文件",
                    null
            );
        }

        if (sessionId == null || sessionId <= 0) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "课程ID不能为空",
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
            // 读取 Excel 文件中的学员数据
            List<StudentImportDTO> students = new ArrayList<>();
            InputStream inputStream = file.getInputStream();
            EasyExcel.read(inputStream, StudentImportDTO.class, new com.alibaba.excel.event.AnalysisEventListener<StudentImportDTO>() {
                @Override
                public void invoke(StudentImportDTO data, com.alibaba.excel.context.AnalysisContext context) {
                    if (data != null && data.getName() != null) {
                        students.add(data);
                    }
                }

                @Override
                public void doAfterAllAnalysed(com.alibaba.excel.context.AnalysisContext context) {
                }
            })
                    .headRowNumber(1)  // 第一行是表头
                    .doReadAll();

            log.info("学员导入预检查 - 读取 {} 条数据，课程ID={}", students.size(), sessionId);

            // 调用预检查服务
            Map<String, Object> precheckResult = studentImportService.precheck(sessionId, students);

            return new ResponseResult<>(
                    SystemErrorCode.SUCCESS.getCode(),
                    "预检查完成",
                    precheckResult
            );

        } catch (Exception e) {
            log.error("学员导入预检查失败", e);
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "预检查失败: " + e.getMessage(),
                    null
            );
        }
    }

    /**
     * 学员导入 - 执行导入
     * 仅导入新学员，拒绝重复学员（防重复导入）
     *
     * @param file 上传的 Excel 文件
     * @param sessionId 课程ID
     * @return 导入结果：成功导入数 + 拒绝数 + 失败数
     */
    @PostMapping("/students")
    public ResponseResult<Map<String, Object>> importStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sessionId") Long sessionId) {

        // 参数验证
        if (file == null || file.isEmpty()) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "请上传 Excel 文件",
                    null
            );
        }

        if (sessionId == null || sessionId <= 0) {
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "课程ID不能为空",
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
            // 读取 Excel 文件中的学员数据
            List<StudentImportDTO> students = new ArrayList<>();
            InputStream inputStream = file.getInputStream();
            EasyExcel.read(inputStream, StudentImportDTO.class, new com.alibaba.excel.event.AnalysisEventListener<StudentImportDTO>() {
                @Override
                public void invoke(StudentImportDTO data, com.alibaba.excel.context.AnalysisContext context) {
                    if (data != null && data.getName() != null) {
                        students.add(data);
                    }
                }

                @Override
                public void doAfterAllAnalysed(com.alibaba.excel.context.AnalysisContext context) {
                }
            })
                    .headRowNumber(1)  // 第一行是表头
                    .doReadAll();

            log.info("学员导入执行 - 读取 {} 条数据，课程ID={}", students.size(), sessionId);

            // 调用导入服务
            Map<String, Object> importResult = studentImportService.importStudents(sessionId, students);

            return new ResponseResult<>(
                    SystemErrorCode.SUCCESS.getCode(),
                    "导入完成",
                    importResult
            );

        } catch (Exception e) {
            log.error("学员导入执行失败", e);
            return new ResponseResult<>(
                    SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "导入失败: " + e.getMessage(),
                    null
            );
        }
    }
}

package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Student;
import cc.vipassana.service.StudentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 学员管理控制器
 *
 * 负责学员信息的CRUD操作、导入、查询、统计等功能
 */
@Slf4j
@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    /**
     * 获取会话内所有学员
     *
     * @param sessionId 会话ID
     * @param page 页码，默认为1
     * @param size 页数量，默认为20
     * @return 学员列表
     */
    @GetMapping
    public ResponseResult<ResponseResult.ListData<Student>> getStudents(
            @RequestParam("sessionId") Long sessionId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        try {
            List<Student> students;
            if (page == 1 && size == 20) {
                students = studentService.getStudentsBySession(sessionId);
            } else {
                students = studentService.getStudentsBySessionWithPagination(sessionId, page, size);
            }

            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取学员列表成功",
                    new ResponseResult.ListData<>(students));
        } catch (Exception e) {
            log.error("获取学员列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取学员列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取单个学员
     *
     * @param id 学员ID
     * @return 学员信息
     */
    @GetMapping("/{id}")
    public ResponseResult<Student> getStudent(@PathVariable Long id) {
        try {
            Student student = studentService.getStudentById(id);
            if (student == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "学员不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取学员成功", student);
        } catch (Exception e) {
            log.error("获取学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建学员
     *
     * @param student 学员信息
     * @return 新创建学员的ID
     */
    @PostMapping
    public ResponseResult<Long> createStudent(@RequestBody Student student) {
        try {
            if (student == null || student.getName() == null || student.getName().trim().isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "学员信息不完整", null);
            }

            Long id = studentService.createStudent(student);
            if (id != null) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "创建学员成功", id);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建学员失败", null);
        } catch (Exception e) {
            log.error("创建学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新学员
     *
     * @param id 学员ID
     * @param student 学员信息
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        try {
            if (student == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "学员信息为空", null);
            }

            student.setId(id);
            boolean success = studentService.updateStudent(student);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "更新学员成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新学员失败", null);
        } catch (Exception e) {
            log.error("更新学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除学员
     *
     * @param id 学员ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteStudent(@PathVariable Long id) {
        try {
            boolean success = studentService.deleteStudent(id);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "删除学员成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除学员失败", null);
        } catch (Exception e) {
            log.error("删除学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 批量导入学员（JSON格式）
     *
     * @param sessionId 会话ID
     * @param students 学员列表
     * @return 导入数量
     */
    @PostMapping("/import")
    public ResponseResult<Integer> importStudents(
            @RequestParam("sessionId") Long sessionId,
            @RequestBody List<Student> students) {
        try {
            if (sessionId == null || students == null || students.isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID或学员列表为空", null);
            }

            int count = studentService.batchImportStudents(sessionId, students);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "导入学员成功: " + count + " 条", count);
        } catch (Exception e) {
            log.error("导入学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "导入学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 从 Excel 文件导入学员
     *
     * @param sessionId 会话ID
     * @param file Excel 文件
     * @return 导入数量
     */
    @PostMapping("/import-excel")
    public ResponseResult<Integer> importStudentsFromExcel(
            @RequestParam("sessionId") Long sessionId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            if (file == null || file.isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "文件为空", null);
            }

            // 验证文件格式
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "仅支持 Excel 文件 (.xlsx 或 .xls)", null);
            }

            int count = studentService.importStudentsFromExcel(sessionId, file);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "导入学员成功: " + count + " 条", count);
        } catch (Exception e) {
            log.error("从 Excel 导入学员失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "导入学员失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取排序后的学员列表（用于分配）
     *
     * @param sessionId 会话ID
     * @return 按优先级排序的学员列表
     */
    @GetMapping("/sorted")
    public ResponseResult<ResponseResult.ListData<Student>> getSortedStudents(
            @RequestParam("sessionId") Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            List<Student> students = studentService.getSortedStudents(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取排序学员列表成功", new ResponseResult.ListData<>(students));
        } catch (Exception e) {
            log.error("获取排序学员列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取排序学员列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 统计会话学员总数
     *
     * @param sessionId 会话ID
     * @return 学员总数
     */
    @GetMapping("/count")
    public ResponseResult<Integer> countStudents(@RequestParam("sessionId") Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            int count = studentService.countBySessionId(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取学员总数成功", count);
        } catch (Exception e) {
            log.error("获取学员总数失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取学员总数失败: " + e.getMessage(), null);
        }
    }
}

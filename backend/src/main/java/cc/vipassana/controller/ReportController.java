package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Allocation;
import cc.vipassana.entity.MeditationSeat;
import cc.vipassana.entity.Student;
import cc.vipassana.mapper.AllocationMapper;
import cc.vipassana.mapper.MeditationSeatMapper;
import cc.vipassana.mapper.StudentMapper;
import cc.vipassana.service.AllocationService;
import cc.vipassana.service.MeditationSeatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 报告生成控制器
 *
 * 负责生成各类报告，包括房间分配报告、禅堂座位报告、统计报告等
 */
@Slf4j
@RestController
@RequestMapping("/api/reports")
@Tag(name = "ReportController", description = "报告生成")
public class ReportController {

    @Autowired
    private AllocationMapper allocationMapper;

    @Autowired
    private MeditationSeatMapper meditationSeatMapper;

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private AllocationService allocationService;

    @Autowired
    private MeditationSeatService meditationSeatService;

    /**
     * 生成房间分配报告
     *
     * @param sessionId 会话ID
     * @return 房间分配报告数据
     */
    @GetMapping("/{sessionId}/allocation")
    @Operation(summary = "生成房间分配报告")
    public ResponseResult<Map<String, Object>> getAllocationReport(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            Map<String, Object> report = new HashMap<>();

            // 获取分配数据
            List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
            List<Student> students = studentMapper.selectBySessionId(sessionId);

            // 统计数据
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalStudents", students.size());
            statistics.put("allocatedStudents", allocations.size());
            statistics.put("unallocatedStudents", students.size() - allocations.size());

            // 按床位分组
            Map<Long, List<Allocation>> byBed = allocations.stream()
                    .collect(Collectors.groupingBy(Allocation::getBedId));

            report.put("statistics", statistics);
            report.put("allocations", allocations);
            report.put("byBed", byBed);

            log.info("生成房间分配报告，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "生成房间分配报告成功", report);
        } catch (Exception e) {
            log.error("生成房间分配报告失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成房间分配报告失败: " + e.getMessage(), null);
        }
    }

    /**
     * 生成禅堂座位报告
     *
     * @param sessionId 会话ID
     * @return 禅堂座位报告数据
     */
    @GetMapping("/{sessionId}/meditation-seat")
    @Operation(summary = "生成禅堂座位报告")
    public ResponseResult<Map<String, Object>> getMeditationSeatReport(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            Map<String, Object> report = new HashMap<>();

            // 获取座位数据
            List<MeditationSeat> seats = meditationSeatMapper.selectBySessionId(sessionId);

            // 获取座位统计信息
            MeditationSeatService.SeatStatistics statistics = meditationSeatService.getStatistics(sessionId);

            // 按区域分组
            Map<String, List<MeditationSeat>> byRegion = seats.stream()
                    .collect(Collectors.groupingBy(MeditationSeat::getRegionCode));

            // 按性别分组
            Map<String, List<MeditationSeat>> byGender = seats.stream()
                    .collect(Collectors.groupingBy(MeditationSeat::getGender));

            report.put("statistics", statistics);
            report.put("seats", seats);
            report.put("byRegion", byRegion);
            report.put("byGender", byGender);

            log.info("生成禅堂座位报告，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "生成禅堂座位报告成功", report);
        } catch (Exception e) {
            log.error("生成禅堂座位报告失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成禅堂座位报告失败: " + e.getMessage(), null);
        }
    }

    /**
     * 生成学员统计报告
     *
     * @param sessionId 会话ID
     * @return 学员统计报告数据
     */
    @GetMapping("/{sessionId}/student-statistics")
    @Operation(summary = "生成学员统计报告")
    public ResponseResult<Map<String, Object>> getStudentStatisticsReport(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            Map<String, Object> report = new HashMap<>();

            // 获取学员数据
            List<Student> students = studentMapper.selectBySessionId(sessionId);

            // 按性别统计
            Map<String, Long> byGender = students.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getGender() != null ? s.getGender() : "未知",
                            Collectors.counting()
                    ));

            // 按学员类型统计
            Map<String, Long> byStudentType = students.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getStudentType() != null ? s.getStudentType() : "未知",
                            Collectors.counting()
                    ));

            // 按年龄分段统计
            Map<String, Long> byAgeGroup = students.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getAgeGroup() != null ? s.getAgeGroup() : "未知",
                            Collectors.counting()
                    ));

            report.put("totalStudents", students.size());
            report.put("byGender", byGender);
            report.put("byStudentType", byStudentType);
            report.put("byAgeGroup", byAgeGroup);

            log.info("生成学员统计报告，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "生成学员统计报告成功", report);
        } catch (Exception e) {
            log.error("生成学员统计报告失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成学员统计报告失败: " + e.getMessage(), null);
        }
    }

    /**
     * 生成综合报告
     *
     * @param sessionId 会话ID
     * @return 综合报告数据
     */
    @GetMapping("/{sessionId}/comprehensive")
    @Operation(summary = "生成综合报告")
    public ResponseResult<Map<String, Object>> getComprehensiveReport(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            Map<String, Object> report = new HashMap<>();

            // 学员统计
            List<Student> students = studentMapper.selectBySessionId(sessionId);
            Map<String, Long> studentsByGender = students.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getGender() != null ? s.getGender() : "未知",
                            Collectors.counting()
                    ));

            // 房间分配统计
            List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
            int allocatedStudents = allocations.size();
            int unallocatedStudents = students.size() - allocations.size();

            // 禅堂座位统计
            MeditationSeatService.SeatStatistics seatStats = meditationSeatService.getStatistics(sessionId);

            // 冲突检测
            List<?> conflicts = allocationService.getConflicts(sessionId);

            report.put("sessionId", sessionId);
            report.put("timestamp", new Date());
            report.put("studentSummary", new HashMap<String, Object>() {{
                put("total", students.size());
                put("byGender", studentsByGender);
            }});
            report.put("allocationSummary", new HashMap<String, Object>() {{
                put("allocated", allocatedStudents);
                put("unallocated", unallocatedStudents);
                put("allocationRate", students.size() > 0 ?
                        String.format("%.2f%%", (allocatedStudents * 100.0 / students.size())) : "0%");
            }});
            report.put("seatSummary", new HashMap<String, Object>() {{
                put("totalSeats", seatStats.totalSeats);
                put("occupiedSeats", seatStats.occupiedSeats);
                put("availableSeats", seatStats.availableSeats);
                put("occupancyRate", String.format("%.2f%%", seatStats.occupancyRate * 100));
            }});
            report.put("conflictSummary", new HashMap<String, Object>() {{
                put("totalConflicts", conflicts != null ? conflicts.size() : 0);
            }});

            log.info("生成综合报告，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "生成综合报告成功", report);
        } catch (Exception e) {
            log.error("生成综合报告失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成综合报告失败: " + e.getMessage(), null);
        }
    }

    /**
     * 生成冲突报告
     *
     * @param sessionId 会话ID
     * @return 冲突报告数据
     */
    @GetMapping("/{sessionId}/conflicts")
    @Operation(summary = "生成冲突报告")
    public ResponseResult<Map<String, Object>> getConflictReport(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            Map<String, Object> report = new HashMap<>();

            // 检测冲突
            List<?> conflicts = allocationService.getConflicts(sessionId);

            report.put("sessionId", sessionId);
            report.put("totalConflicts", conflicts != null ? conflicts.size() : 0);
            report.put("conflicts", conflicts != null ? conflicts : new ArrayList<>());

            log.info("生成冲突报告，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "生成冲突报告成功", report);
        } catch (Exception e) {
            log.error("生成冲突报告失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成冲突报告失败: " + e.getMessage(), null);
        }
    }
}

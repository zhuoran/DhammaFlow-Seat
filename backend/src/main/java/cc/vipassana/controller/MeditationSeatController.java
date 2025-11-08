package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.MeditationSeat;
import cc.vipassana.service.MeditationSeatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 禅堂座位控制器
 * 负责座位生成、分配、交换等API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/meditation-seats")
public class MeditationSeatController {

    @Autowired
    private MeditationSeatService meditationSeatService;

    /**
     * 为指定会期生成禅堂座位
     *
     * @param sessionId 会期ID
     * @return 生成的座位列表
     */
    @PostMapping("/generate")
    public ResponseResult<ResponseResult.ListData<MeditationSeat>> generateSeats(
            @RequestParam Long sessionId) {
        try {
            log.info("开始生成禅堂座位，会期ID: {}", sessionId);

            // 先删除该会期的现有座位
            meditationSeatService.deleteSessionSeats(sessionId);

            // 生成新座位
            List<MeditationSeat> seats = meditationSeatService.generateSeats(sessionId);

            log.info("禅堂座位生成成功，共生成 {} 个座位", seats.size());
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "座位生成成功", new ResponseResult.ListData<>(seats));
        } catch (Exception e) {
            log.error("生成禅堂座位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "生成座位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取指定会期的所有座位
     *
     * @param sessionId 会期ID
     * @return 座位列表
     */
    @GetMapping("/session/{sessionId}")
    public ResponseResult<ResponseResult.ListData<MeditationSeat>> getSeatsBySession(
            @PathVariable Long sessionId) {
        try {
            List<MeditationSeat> seats = meditationSeatService.getSeats(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取座位列表成功", new ResponseResult.ListData<>(seats));
        } catch (Exception e) {
            log.error("获取座位列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取座位列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 按区域获取座位
     *
     * @param sessionId 会期ID
     * @param regionCode 区域代码（A/B等）
     * @return 该区域的座位列表
     */
    @GetMapping("/region")
    public ResponseResult<ResponseResult.ListData<MeditationSeat>> getSeatsByRegion(
            @RequestParam Long sessionId,
            @RequestParam String regionCode) {
        try {
            List<MeditationSeat> seats = meditationSeatService.getSeatsByRegion(sessionId, regionCode);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取区域座位列表成功", new ResponseResult.ListData<>(seats));
        } catch (Exception e) {
            log.error("获取区域座位列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取区域座位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 交换两个座位的学员
     *
     * @param seatId1 座位1的ID
     * @param seatId2 座位2的ID
     * @return 交换结果
     */
    @PutMapping("/{seatId1}/swap/{seatId2}")
    public ResponseResult<String> swapSeats(
            @PathVariable Long seatId1,
            @PathVariable Long seatId2) {
        try {
            log.info("开始交换座位: {} <-> {}", seatId1, seatId2);
            meditationSeatService.swapSeats(seatId1, seatId2);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "座位交换成功", "交换完成");
        } catch (Exception e) {
            log.error("座位交换失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "座位交换失败: " + e.getMessage(), null);
        }
    }

    /**
     * 为学员分配座位
     *
     * @param seatId 座位ID
     * @param studentId 学员ID
     * @return 分配结果
     */
    @PutMapping("/{seatId}/assign")
    public ResponseResult<String> assignSeat(
            @PathVariable Long seatId,
            @RequestParam Long studentId) {
        try {
            log.info("开始分配座位: 学员 {} 分配到座位 {}", studentId, seatId);
            meditationSeatService.assignSeat(studentId, seatId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "座位分配成功", "分配完成");
        } catch (Exception e) {
            log.error("座位分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "座位分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取座位占用统计
     *
     * @param sessionId 会期ID
     * @return 统计信息
     */
    @GetMapping("/statistics/{sessionId}")
    public ResponseResult<MeditationSeatService.SeatStatistics> getStatistics(
            @PathVariable Long sessionId) {
        try {
            MeditationSeatService.SeatStatistics stats = meditationSeatService.getStatistics(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取统计信息成功", stats);
        } catch (Exception e) {
            log.error("获取统计信息失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取统计信息失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除会期的所有座位（用于重新生成）
     *
     * @param sessionId 会期ID
     * @return 删除结果
     */
    @DeleteMapping("/session/{sessionId}")
    public ResponseResult<String> deleteSessionSeats(
            @PathVariable Long sessionId) {
        try {
            log.info("删除会期 {} 的所有座位", sessionId);
            meditationSeatService.deleteSessionSeats(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "座位删除成功", "删除完成");
        } catch (Exception e) {
            log.error("删除座位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除座位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取单个座位信息
     *
     * @param seatId 座位ID
     * @return 座位信息
     */
    @GetMapping("/{seatId}")
    public ResponseResult<MeditationSeat> getSeat(@PathVariable Long seatId) {
        try {
            List<MeditationSeat> allSeats = meditationSeatService.getSeats(null);
            MeditationSeat seat = allSeats.stream()
                    .filter(s -> s.getId().equals(seatId))
                    .findFirst()
                    .orElse(null);

            if (seat == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "座位不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取座位成功", seat);
        } catch (Exception e) {
            log.error("获取座位信息失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取座位失败: " + e.getMessage(), null);
        }
    }
}

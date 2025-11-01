package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Bed;
import cc.vipassana.service.BedService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 床位管理控制器
 * 负责床位的CRUD操作、查询、统计等功能
 */
@Slf4j
@RestController
@RequestMapping("/api/beds")
public class BedController {

    @Autowired
    private BedService bedService;

    /**
     * 获取所有床位
     *
     * @param roomId 房间ID（可选）
     * @return 床位列表
     */
    @GetMapping
    public ResponseResult<ResponseResult.ListData<Bed>> getBeds(
            @RequestParam(value = "roomId", required = false) Long roomId) {
        try {
            List<Bed> beds;
            if (roomId != null) {
                beds = bedService.getBedsByRoom(roomId);
            } else {
                beds = bedService.getAllBeds();
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取床位列表成功",
                    new ResponseResult.ListData<>(beds));
        } catch (Exception e) {
            log.error("获取床位列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取床位列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取单个床位
     *
     * @param id 床位ID
     * @return 床位信息
     */
    @GetMapping("/{id}")
    public ResponseResult<Bed> getBed(@PathVariable Long id) {
        try {
            Bed bed = bedService.getBedById(id);
            if (bed == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "床位不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取床位成功", bed);
        } catch (Exception e) {
            log.error("获取床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建床位
     *
     * @param bed 床位信息
     * @return 新创建床位的ID
     */
    @PostMapping
    public ResponseResult<Long> createBed(@RequestBody Bed bed) {
        try {
            if (bed == null || bed.getRoomId() == null || bed.getBedNumber() == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "床位信息不完整", null);
            }

            Long id = bedService.createBed(bed);
            if (id != null) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "创建床位成功", id);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建床位失败", null);
        } catch (Exception e) {
            log.error("创建床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 批量创建床位
     *
     * @param beds 床位列表
     * @return 创建结果
     */
    @PostMapping("/batch")
    public ResponseResult<Void> createBedsBatch(@RequestBody List<Bed> beds) {
        try {
            if (beds == null || beds.isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "床位列表为空", null);
            }

            boolean success = bedService.createBedsBatch(beds);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "批量创建床位成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "批量创建床位失败", null);
        } catch (Exception e) {
            log.error("批量创建床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "批量创建床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新床位
     *
     * @param id 床位ID
     * @param bed 床位信息
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateBed(@PathVariable Long id, @RequestBody Bed bed) {
        try {
            if (bed == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "床位信息为空", null);
            }

            bed.setId(id);
            boolean success = bedService.updateBed(bed);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "更新床位成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新床位失败", null);
        } catch (Exception e) {
            log.error("更新床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除床位
     *
     * @param id 床位ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteBed(@PathVariable Long id) {
        try {
            boolean success = bedService.deleteBed(id);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "删除床位成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除床位失败", null);
        } catch (Exception e) {
            log.error("删除床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除房间的所有床位
     *
     * @param roomId 房间ID
     * @return 删除结果
     */
    @DeleteMapping("/room/{roomId}")
    public ResponseResult<Void> deleteBedsOfRoom(@PathVariable Long roomId) {
        try {
            boolean success = bedService.deleteBedsOfRoom(roomId);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "删除房间床位成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除房间床位失败", null);
        } catch (Exception e) {
            log.error("删除房间床位失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除房间床位失败: " + e.getMessage(), null);
        }
    }

    /**
     * 统计床位总数
     *
     * @return 床位总数
     */
    @GetMapping("/count")
    public ResponseResult<Integer> countBeds() {
        try {
            int count = bedService.countBeds();
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取床位总数成功", count);
        } catch (Exception e) {
            log.error("获取床位总数失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取床位总数失败: " + e.getMessage(), null);
        }
    }

    /**
     * 统计房间的床位总数
     *
     * @param roomId 房间ID
     * @return 床位总数
     */
    @GetMapping("/room/{roomId}/count")
    public ResponseResult<Integer> countBedsByRoom(@PathVariable Long roomId) {
        try {
            int count = bedService.countBedsByRoom(roomId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取房间床位总数成功", count);
        } catch (Exception e) {
            log.error("获取房间床位总数失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取房间床位总数失败: " + e.getMessage(), null);
        }
    }
}

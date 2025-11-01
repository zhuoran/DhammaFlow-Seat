package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Allocation;
import cc.vipassana.service.AllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 房间分配REST API控制器
 *
 * 负责学员房间、床位和禅堂座位的自动分配、确认、查询等功能
 */
@Slf4j
@RestController
@RequestMapping("/api/allocations")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    /**
     * 执行自动分配
     *
     * @param sessionId 会话ID
     * @return 分配结果
     */
    @PostMapping("/auto/{sessionId}")
    public ResponseResult<AllocationService.AllocationResult> autoAllocate(@PathVariable Long sessionId) {
        log.info("执行自动分配，期次ID: {}", sessionId);
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            AllocationService.AllocationResult result = allocationService.autoAllocate(sessionId);
            log.info("自动分配完成，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "自动分配成功", result);
        } catch (Exception e) {
            log.error("分配失败，期次ID: {}", sessionId, e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取分配结果
     *
     * @param sessionId 会话ID
     * @return 分配列表
     */
    @GetMapping("/{sessionId}")
    public ResponseResult<ResponseResult.ListData<Allocation>> getAllocationsBySession(
            @PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            List<Allocation> allocations = allocationService.getAllocationsBySession(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取分配列表成功", new ResponseResult.ListData<>(allocations));
        } catch (Exception e) {
            log.error("获取分配列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取分配列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 检测分配冲突
     *
     * @param sessionId 会话ID
     * @return 冲突列表
     */
    @GetMapping("/{sessionId}/conflicts")
    public ResponseResult<List<?>> getConflicts(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            List<?> conflicts = allocationService.getConflicts(sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取冲突列表成功", conflicts);
        } catch (Exception e) {
            log.error("获取冲突列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取冲突列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 确认分配
     *
     * @param sessionId 会话ID
     * @return 确认结果
     */
    @PostMapping("/{sessionId}/confirm")
    public ResponseResult<Void> confirmAllocations(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            allocationService.confirmAllocations(sessionId);
            log.info("分配已确认，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配已确认", null);
        } catch (Exception e) {
            log.error("确认分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "确认分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 清除分配
     *
     * @param sessionId 会话ID
     * @return 清除结果
     */
    @DeleteMapping("/{sessionId}")
    public ResponseResult<Void> clearAllocations(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            allocationService.clearAllocations(sessionId);
            log.info("分配已清除，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配已清除", null);
        } catch (Exception e) {
            log.error("清除分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "清除分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 回滚分配
     *
     * @param sessionId 会话ID
     * @return 回滚结果
     */
    @PostMapping("/{sessionId}/rollback")
    public ResponseResult<Void> rollbackAllocations(@PathVariable Long sessionId) {
        try {
            if (sessionId == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID为空", null);
            }

            allocationService.rollbackAllocations(sessionId);
            log.info("分配已回滚，期次ID: {}", sessionId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配已回滚", null);
        } catch (Exception e) {
            log.error("回滚分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "回滚分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建单个分配（手动分配）
     *
     * @param allocation 分配数据
     * @return 创建结果和分配ID
     */
    @PostMapping
    public ResponseResult<Long> createAllocation(@RequestBody Allocation allocation) {
        try {
            if (allocation.getSessionId() == null || allocation.getStudentId() == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "会话ID或学员ID为空", null);
            }

            Long allocationId = allocationService.createAllocation(allocation);
            log.info("分配创建成功，ID: {}", allocationId);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配创建成功", allocationId);
        } catch (Exception e) {
            log.error("创建分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新单个分配
     *
     * @param id 分配ID
     * @param allocation 更新数据
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateAllocation(@PathVariable Long id, @RequestBody Allocation allocation) {
        try {
            if (id == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "分配ID为空", null);
            }

            allocationService.updateAllocation(id, allocation);
            log.info("分配更新成功，ID: {}", id);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配更新成功", null);
        } catch (Exception e) {
            log.error("更新分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新分配失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除单个分配
     *
     * @param id 分配ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteAllocation(@PathVariable Long id) {
        try {
            if (id == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "分配ID为空", null);
            }

            allocationService.deleteAllocation(id);
            log.info("分配删除成功，ID: {}", id);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "分配删除成功", null);
        } catch (Exception e) {
            log.error("删除分配失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除分配失败: " + e.getMessage(), null);
        }
    }
}

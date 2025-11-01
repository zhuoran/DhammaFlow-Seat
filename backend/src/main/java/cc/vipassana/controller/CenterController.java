package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Center;
import cc.vipassana.mapper.CenterMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 禅修中心管理控制器
 *
 * 负责禅修中心信息的CRUD操作和查询功能
 */
@Slf4j
@RestController
@RequestMapping("/api/centers")
@Tag(name = "CenterController", description = "禅修中心管理")
public class CenterController {

    @Autowired
    private CenterMapper centerMapper;

    /**
     * 获取所有中心
     *
     * @return 中心列表
     */
    @GetMapping
    @Operation(summary = "获取所有禅修中心")
    public ResponseResult<ResponseResult.ListData<Center>> getAllCenters() {
        try {
            List<Center> centers = centerMapper.selectAll();
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取中心列表成功",
                    new ResponseResult.ListData<>(centers));
        } catch (Exception e) {
            log.error("获取中心列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取中心列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 根据 ID 获取中心
     *
     * @param id 中心ID
     * @return 中心信息
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取禅修中心详情")
    public ResponseResult<Center> getCenterById(@PathVariable Long id) {
        try {
            if (id == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "中心ID为空", null);
            }

            Center center = centerMapper.selectById(id);
            if (center == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "中心不存在", null);
            }

            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取中心成功", center);
        } catch (Exception e) {
            log.error("获取中心详情失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取中心详情失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建中心
     *
     * @param center 中心信息
     * @return 新创建中心信息
     */
    @PostMapping
    @Operation(summary = "创建禅修中心")
    public ResponseResult<Center> createCenter(@RequestBody Center center) {
        try {
            if (center == null || center.getCenterName() == null || center.getCenterName().trim().isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "中心信息不完整", null);
            }

            centerMapper.insert(center);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "创建中心成功", center);
        } catch (Exception e) {
            log.error("创建中心失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建中心失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新中心
     *
     * @param id 中心ID
     * @param center 中心信息
     * @return 更新后的中心信息
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新禅修中心信息")
    public ResponseResult<Center> updateCenter(@PathVariable Long id, @RequestBody Center center) {
        try {
            if (center == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "中心信息为空", null);
            }

            center.setId(id);
            centerMapper.update(center);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "更新中心成功", center);
        } catch (Exception e) {
            log.error("更新中心失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新中心失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除中心
     *
     * @param id 中心ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除禅修中心")
    public ResponseResult<Void> deleteCenter(@PathVariable Long id) {
        try {
            if (id == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "中心ID为空", null);
            }

            centerMapper.delete(id);
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "删除中心成功", null);
        } catch (Exception e) {
            log.error("删除中心失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除中心失败: " + e.getMessage(), null);
        }
    }
}

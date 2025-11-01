package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.common.SystemErrorCode;
import cc.vipassana.entity.Session;
import cc.vipassana.service.SessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 课程期次管理控制器
 *
 * 负责课程期次的CRUD操作、查询、统计等功能
 */
@Slf4j
@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    /**
     * 获取所有期次
     *
     * @param centerId 中心ID（可选）
     * @param status 期次状态（可选）
     * @return 期次列表
     */
    @GetMapping
    public ResponseResult<ResponseResult.ListData<Session>> getSessions(
            @RequestParam(value = "centerId", required = false) Long centerId,
            @RequestParam(value = "status", required = false) String status) {
        try {
            List<Session> sessions;
            if (centerId != null) {
                sessions = sessionService.getSessionsByCenter(centerId);
            } else if (status != null) {
                sessions = sessionService.getSessionsByStatus(status);
            } else {
                sessions = sessionService.getAllSessions();
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取期次列表成功",
                    new ResponseResult.ListData<>(sessions));
        } catch (Exception e) {
            log.error("获取期次列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取期次列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取单个期次
     *
     * @param id 期次ID
     * @return 期次信息
     */
    @GetMapping("/{id}")
    public ResponseResult<Session> getSession(@PathVariable Long id) {
        try {
            Session session = sessionService.getSessionById(id);
            if (session == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "期次不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取期次成功", session);
        } catch (Exception e) {
            log.error("获取期次失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取期次失败: " + e.getMessage(), null);
        }
    }

    /**
     * 根据期次代码查询期次
     *
     * @param code 期次代码
     * @return 期次信息
     */
    @GetMapping("/code/{code}")
    public ResponseResult<Session> getSessionByCode(@PathVariable String code) {
        try {
            if (code == null || code.trim().isEmpty()) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "期次代码为空", null);
            }

            Session session = sessionService.getSessionByCode(code);
            if (session == null) {
                return new ResponseResult<>(SystemErrorCode.DATA_NOT_FOUND.getCode(),
                        "期次不存在", null);
            }
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(), "获取期次成功", session);
        } catch (Exception e) {
            log.error("获取期次失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取期次失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建期次
     *
     * @param session 期次信息
     * @return 新创建期次的ID
     */
    @PostMapping
    public ResponseResult<Long> createSession(@RequestBody Session session) {
        try {
            if (session == null || session.getCenterId() == null || session.getSessionCode() == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "期次信息不完整", null);
            }

            Long id = sessionService.createSession(session);
            if (id != null) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "创建期次成功", id);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建期次失败", null);
        } catch (Exception e) {
            log.error("创建期次失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "创建期次失败: " + e.getMessage(), null);
        }
    }

    /**
     * 更新期次
     *
     * @param id 期次ID
     * @param session 期次信息
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateSession(@PathVariable Long id, @RequestBody Session session) {
        try {
            if (session == null) {
                return new ResponseResult<>(SystemErrorCode.PARAM_ERROR.getCode(),
                        "期次信息为空", null);
            }

            session.setId(id);
            boolean success = sessionService.updateSession(session);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "更新期次成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新期次失败", null);
        } catch (Exception e) {
            log.error("更新期次失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "更新期次失败: " + e.getMessage(), null);
        }
    }

    /**
     * 删除期次
     *
     * @param id 期次ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteSession(@PathVariable Long id) {
        try {
            boolean success = sessionService.deleteSession(id);
            if (success) {
                return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                        "删除期次成功", null);
            }
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除期次失败", null);
        } catch (Exception e) {
            log.error("删除期次失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "删除期次失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取进行中的期次
     *
     * @return 活跃期次列表
     */
    @GetMapping("/active")
    public ResponseResult<ResponseResult.ListData<Session>> getActiveSessions() {
        try {
            List<Session> sessions = sessionService.getActiveSessions();
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取进行中的期次列表成功", new ResponseResult.ListData<>(sessions));
        } catch (Exception e) {
            log.error("获取进行中的期次列表失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取进行中的期次列表失败: " + e.getMessage(), null);
        }
    }

    /**
     * 统计期次总数
     *
     * @return 期次总数
     */
    @GetMapping("/count")
    public ResponseResult<Integer> countSessions() {
        try {
            int count = sessionService.countSessions();
            return new ResponseResult<>(SystemErrorCode.SUCCESS.getCode(),
                    "获取期次总数成功", count);
        } catch (Exception e) {
            log.error("获取期次总数失败", e);
            return new ResponseResult<>(SystemErrorCode.BUSINESS_ERROR.getCode(),
                    "获取期次总数失败: " + e.getMessage(), null);
        }
    }
}

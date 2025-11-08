package cc.vipassana.service.impl;

import cc.vipassana.dto.SessionConfigDTO;
import cc.vipassana.mapper.SessionMapper;
import cc.vipassana.service.SessionConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 课程设置业务服务实现
 *
 * MVP 版本：极简实现，专注核心功能
 * - 讲师配置（teacher1/teacher2）
 * - 禅堂分离（A/B区域配置）
 * - 座位编号方式
 */
@Slf4j
@Service
public class SessionConfigServiceImpl implements SessionConfigService {

    @Autowired
    private SessionMapper sessionMapper;

    /**
     * 获取课程设置
     * @param sessionId 课程ID
     * @return 课程设置信息
     */
    @Override
    public SessionConfigDTO getSessionConfig(Long sessionId) {
        if (sessionId == null || sessionId <= 0) {
            log.warn("获取课程设置：课程ID无效");
            return null;
        }

        try {
            SessionConfigDTO config = sessionMapper.selectConfigById(sessionId);
            log.info("获取课程设置成功：课程ID={}", sessionId);
            return config;
        } catch (Exception e) {
            log.error("获取课程设置失败：课程ID={}", sessionId, e);
            return null;
        }
    }

    /**
     * 保存课程设置
     * @param sessionId 课程ID
     * @param config 课程设置信息
     * @return 是否保存成功
     */
    @Override
    public boolean saveSessionConfig(Long sessionId, SessionConfigDTO config) {
        if (sessionId == null || sessionId <= 0 || config == null) {
            log.warn("保存课程设置：参数无效");
            return false;
        }

        try {
            int result = sessionMapper.updateConfig(sessionId, config);
            if (result > 0) {
                log.info("保存课程设置成功：课程ID={}, 讲师1={}, 讲师2={}, 禅堂A宽度={}, 禅堂B宽度={}",
                         sessionId, config.getTeacher1Name(), config.getTeacher2Name(),
                         config.getMeditationHallAWidth(), config.getMeditationHallBWidth());
                return true;
            }
            log.warn("保存课程设置失败：没有修改任何记录，课程ID={}", sessionId);
            return false;
        } catch (Exception e) {
            log.error("保存课程设置异常：课程ID={}", sessionId, e);
            return false;
        }
    }
}

package cc.vipassana.service;

import cc.vipassana.dto.SessionConfigDTO;

/**
 * 课程设置业务服务接口
 *
 * MVP 版本：核心配置管理
 * - 讲师配置（支持双师）
 * - 禅堂分离配置（A/B区域）
 * - 座位编号方式
 */
public interface SessionConfigService {

    /**
     * 获取课程设置
     * @param sessionId 课程ID
     * @return 课程设置信息
     */
    SessionConfigDTO getSessionConfig(Long sessionId);

    /**
     * 保存课程设置
     * @param sessionId 课程ID
     * @param config 课程设置信息
     * @return 是否保存成功
     */
    boolean saveSessionConfig(Long sessionId, SessionConfigDTO config);
}

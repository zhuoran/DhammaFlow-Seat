package cc.vipassana.service;

import cc.vipassana.entity.Session;

import java.util.List;

/**
 * 课程期次业务服务接口
 */
public interface SessionService {

    /**
     * 获取所有期次
     */
    List<Session> getAllSessions();

    /**
     * 根据ID获取期次
     */
    Session getSessionById(Long id);

    /**
     * 根据期次代码查询期次
     */
    Session getSessionByCode(String sessionCode);

    /**
     * 按状态查询期次
     */
    List<Session> getSessionsByStatus(String status);

    /**
     * 创建期次
     */
    Long createSession(Session session);

    /**
     * 更新期次
     */
    boolean updateSession(Session session);

    /**
     * 删除期次
     */
    boolean deleteSession(Long id);

    /**
     * 获取进行中的期次
     */
    List<Session> getActiveSessions();

    /**
     * 获取中心的期次列表
     */
    List<Session> getSessionsByCenter(Long centerId);

    /**
     * 统计期次总数
     */
    int countSessions();
}

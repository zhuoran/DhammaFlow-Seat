package cc.vipassana.service.impl;

import cc.vipassana.entity.Session;
import cc.vipassana.mapper.SessionMapper;
import cc.vipassana.service.SessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 课程期次业务服务实现
 */
@Slf4j
@Service
public class SessionServiceImpl implements SessionService {

    @Autowired
    private SessionMapper sessionMapper;

    @Override
    public List<Session> getAllSessions() {
        return sessionMapper.selectAll();
    }

    @Override
    public Session getSessionById(Long id) {
        return sessionMapper.selectById(id);
    }

    @Override
    public Session getSessionByCode(String sessionCode) {
        return sessionMapper.selectBySessionCode(sessionCode);
    }

    @Override
    public List<Session> getSessionsByStatus(String status) {
        return sessionMapper.selectByStatus(status);
    }

    @Override
    public Long createSession(Session session) {
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        if (session.getStatus() == null) {
            session.setStatus("PLANNING");
        }
        int result = sessionMapper.insert(session);
        if (result > 0) {
            log.info("创建课程期次成功: {} ({})", session.getSessionCode(), session.getId());
            return session.getId();
        }
        log.error("创建课程期次失败");
        return null;
    }

    @Override
    public boolean updateSession(Session session) {
        session.setUpdatedAt(LocalDateTime.now());
        int result = sessionMapper.update(session);
        if (result > 0) {
            log.info("更新课程期次成功: {}", session.getId());
            return true;
        }
        log.error("更新课程期次失败: {}", session.getId());
        return false;
    }

    @Override
    public boolean deleteSession(Long id) {
        int result = sessionMapper.delete(id);
        if (result > 0) {
            log.info("删除课程期次成功: {}", id);
            return true;
        }
        log.error("删除课程期次失败: {}", id);
        return false;
    }

    @Override
    public List<Session> getActiveSessions() {
        List<Session> sessions = sessionMapper.selectByStatus("ACTIVE");
        if (sessions == null) {
            return sessionMapper.selectByStatus("IN_PROGRESS");
        }
        return sessions;
    }

    @Override
    public List<Session> getSessionsByCenter(Long centerId) {
        // 获取所有期次并按中心ID过滤
        List<Session> allSessions = sessionMapper.selectAll();
        return allSessions.stream()
                .filter(s -> centerId.equals(s.getCenterId()))
                .collect(Collectors.toList());
    }

    @Override
    public int countSessions() {
        return sessionMapper.count();
    }
}

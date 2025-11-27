package cc.vipassana.service;

import cc.vipassana.dto.layout.CompiledLayout;
import cc.vipassana.dto.layout.HallConfigResponse;
import cc.vipassana.dto.layout.HallLayout;
import cc.vipassana.entity.MeditationHallConfig;

import java.util.List;

public interface MeditationHallConfigService {
    List<HallConfigResponse> listBySession(Long sessionId);

    HallConfigResponse getById(Long id);

    HallConfigResponse updateLayout(Long id, HallLayout layout);

    CompiledLayout compile(Long id);

    /**
     * 按会期写入/更新单条配置，并清理同会期其它配置
     */
    HallConfigResponse upsertBySession(Long sessionId, Long centerId, HallLayout layout, String templateId, String numberingType, String hallUsage);
}

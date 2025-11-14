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
}

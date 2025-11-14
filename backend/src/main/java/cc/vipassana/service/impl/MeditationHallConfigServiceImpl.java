package cc.vipassana.service.impl;

import cc.vipassana.dto.layout.CompiledLayout;
import cc.vipassana.dto.layout.HallConfigResponse;
import cc.vipassana.dto.layout.HallLayout;
import cc.vipassana.entity.MeditationHallConfig;
import cc.vipassana.mapper.MeditationHallConfigMapper;
import cc.vipassana.service.MeditationHallConfigService;
import cc.vipassana.service.layout.LayoutCompiler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeditationHallConfigServiceImpl implements MeditationHallConfigService {

    private final MeditationHallConfigMapper meditationHallConfigMapper;
    private final LayoutCompiler layoutCompiler;
    private final ObjectMapper objectMapper;

    @Override
    public List<HallConfigResponse> listBySession(Long sessionId) {
        List<MeditationHallConfig> configs = meditationHallConfigMapper.selectBySessionId(sessionId);
        return configs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HallConfigResponse getById(Long id) {
        MeditationHallConfig config = meditationHallConfigMapper.selectById(id);
        if (config == null) {
            return null;
        }
        return toResponse(config);
    }

    @Override
    @Transactional
    public HallConfigResponse updateLayout(Long id, HallLayout layout) {
        MeditationHallConfig config = meditationHallConfigMapper.selectById(id);
        if (config == null) {
            throw new IllegalArgumentException("禅堂配置不存在: " + id);
        }
        try {
            config.setLayoutConfig(objectMapper.writeValueAsString(layout));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("无法序列化禅堂布局", e);
        }
        meditationHallConfigMapper.update(config);
        return toResponse(config);
    }

    @Override
    public CompiledLayout compile(Long id) {
        MeditationHallConfig config = meditationHallConfigMapper.selectById(id);
        if (config == null) {
            throw new IllegalArgumentException("禅堂配置不存在: " + id);
        }
        return layoutCompiler.compile(config);
    }

    private HallConfigResponse toResponse(MeditationHallConfig config) {
        return HallConfigResponse.builder()
                .id(config.getId())
                .centerId(config.getCenterId())
                .sessionId(config.getSessionId())
                .regionCode(config.getRegionCode())
                .regionName(config.getRegionName())
                .layout(layoutCompiler.loadLayout(config))
                .build();
    }
}

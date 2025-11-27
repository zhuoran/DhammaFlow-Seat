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
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.Comparator;
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
                .filter(cfg -> StringUtils.hasText(cfg.getLayoutConfig()))
                .sorted(Comparator.comparing(MeditationHallConfig::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                .limit(1)
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
        if (layout == null || CollectionUtils.isEmpty(layout.getSections())) {
            throw new IllegalArgumentException("禅堂布局不能为空");
        }
        try {
            config.setLayoutConfig(objectMapper.writeValueAsString(layout));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("无法序列化禅堂布局", e);
        }
        meditationHallConfigMapper.update(config);
        // 每个会期只保留一条配置，删除其他配置避免重复生成
        meditationHallConfigMapper.deleteOthersInSession(config.getSessionId(), config.getId());
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

    @Transactional
    public HallConfigResponse upsertBySession(Long sessionId, Long centerId, HallLayout layout, String templateId, String numberingType, String hallUsage) {
        if (sessionId == null) {
            throw new IllegalArgumentException("sessionId 不能为空");
        }
        if (layout == null || CollectionUtils.isEmpty(layout.getSections())) {
            throw new IllegalArgumentException("禅堂布局不能为空");
        }
        // 使用最新一条，有则更新，无则插入
        MeditationHallConfig existing = meditationHallConfigMapper.selectLatestBySessionId(sessionId);
        MeditationHallConfig target;
        if (existing == null) {
            target = MeditationHallConfig.builder()
                    .sessionId(sessionId)
                    .centerId(centerId)
                    .regionCode("A") // 保留字段，默认A
                    .regionName("禅堂")
                    .numberingType(numberingType)
                    .hallUsage(hallUsage)
                    .build();
        } else {
            target = existing;
            target.setNumberingType(numberingType);
            target.setHallUsage(hallUsage);
        }
        if (!StringUtils.hasText(target.getNumberingType())) {
            target.setNumberingType("SEQUENTIAL");
        }
        if (!StringUtils.hasText(target.getHallUsage())) {
            target.setHallUsage("SINGLE");
        }
        try {
            target.setLayoutConfig(objectMapper.writeValueAsString(layout));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("无法序列化禅堂布局", e);
        }
        if (target.getId() == null) {
            meditationHallConfigMapper.insert(target);
        } else {
            meditationHallConfigMapper.update(target);
        }
        meditationHallConfigMapper.deleteOthersInSession(sessionId, target.getId());
        return toResponse(target);
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

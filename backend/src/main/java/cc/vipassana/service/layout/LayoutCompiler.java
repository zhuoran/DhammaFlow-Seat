package cc.vipassana.service.layout;

import cc.vipassana.dto.layout.*;
import cc.vipassana.entity.MeditationHallConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 将持久化配置转换为结构化布局的编译器。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LayoutCompiler {

    private final ObjectMapper objectMapper;

    public CompiledLayout compile(MeditationHallConfig config) {
        HallLayout layout = loadLayout(config);
        return compile(layout);
    }

    public CompiledLayout compile(HallLayout layout) {
        List<SeatCell> cells = new ArrayList<>();
        Map<String, SeatSection> sectionMap = new LinkedHashMap<>();
        layout.getSections().forEach(section -> sectionMap.put(section.getName(), section));

        Set<String> reservedKey = layout.getReservedSlots().stream()
                .map(slot -> key(slot.getRow(), slot.getCol()))
                .collect(Collectors.toSet());

        int maxRow = 0;
        int maxCol = 0;
        for (SeatSection section : layout.getSections()) {
            if (section.getRowStart() == null || section.getRowEnd() == null
                    || section.getColStart() == null || section.getColEnd() == null) {
                continue;
            }
            for (int row = section.getRowStart(); row <= section.getRowEnd(); row++) {
                for (int col = section.getColStart(); col <= section.getColEnd(); col++) {
                    SeatCell cell = SeatCell.builder()
                            .row(row)
                            .col(col)
                            .sectionName(section.getName())
                            .purpose(section.getPurpose())
                            .reserved(reservedKey.contains(key(row, col)))
                            .build();
                    cells.add(cell);
                    maxRow = Math.max(maxRow, row);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }

        int totalRows = layout.getTotalRows() != null ? layout.getTotalRows() : maxRow + 1;
        int totalCols = layout.getTotalCols() != null ? layout.getTotalCols() : maxCol + 1;

        return CompiledLayout.builder()
                .totalRows(totalRows)
                .totalCols(totalCols)
                .cells(cells)
                .sections(sectionMap)
                .source(layout)
                .build();
    }

    public HallLayout loadLayout(MeditationHallConfig config) {
        if (StringUtils.hasText(config.getLayoutConfig())) {
            try {
                HallLayout layout = objectMapper.readValue(config.getLayoutConfig(), HallLayout.class);
                return applyDefaults(layout, config);
            } catch (JsonProcessingException e) {
                log.warn("解析禅堂布局JSON失败，将回退到 legacy 配置, hallId={}", config.getId(), e);
            }
        }
        return buildLegacyLayout(config);
    }

    private HallLayout applyDefaults(HallLayout layout, MeditationHallConfig config) {
        if (layout.getNumbering() == null) {
            layout.setNumbering(NumberingConfig.builder()
                    .mode(resolveNumbering(config.getNumberingType()))
                    .prefix(config.getSeatPrefix())
                    .build());
        }
        if (CollectionUtils.isEmpty(layout.getSupportedGenders())) {
            layout.setSupportedGenders(parseSupportedGenders(config));
        }
        if (!StringUtils.hasText(layout.getUsageMode())) {
            layout.setUsageMode(resolveUsageMode(config));
        }
        if (layout.getTotalCols() == null) {
            layout.setTotalCols(safeInt(config.getRegionWidth(), 8));
        }
        if (layout.getTotalRows() == null) {
            layout.setTotalRows(safeInt(config.getRegionRows(), 10));
        }
        return layout;
    }

    private HallLayout buildLegacyLayout(MeditationHallConfig config) {
        int width = safeInt(config.getRegionWidth(), 8);
        int rows = safeInt(config.getRegionRows(), 10);
        SeatSection defaultSection = SeatSection.builder()
                .name(StringUtils.hasText(config.getRegionName()) ? config.getRegionName() : config.getRegionCode())
                .purpose(resolvePurpose(config))
                .rowStart(0)
                .rowEnd(rows - 1)
                .colStart(0)
                .colEnd(width - 1)
                .build();

        return HallLayout.builder()
                .originRow(0)
                .originCol(0)
                .totalRows(rows)
                .totalCols(width)
                .autoRows(config.getRegionRows() == null || config.getRegionRows() == 0)
                .sections(Collections.singletonList(defaultSection))
                .numbering(NumberingConfig.builder()
                        .mode(resolveNumbering(config.getNumberingType()))
                        .prefix(config.getSeatPrefix())
                        .build())
                .supportedGenders(parseSupportedGenders(config))
                .usageMode(resolveUsageMode(config))
                .build();
    }

    private List<String> parseSupportedGenders(MeditationHallConfig config) {
        if (StringUtils.hasText(config.getSupportedGenders())) {
            return Arrays.stream(config.getSupportedGenders().split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .map(String::toUpperCase)
                    .collect(Collectors.toList());
        }
        if (StringUtils.hasText(config.getGenderType())) {
            return Collections.singletonList(config.getGenderType().toUpperCase());
        }
        return Collections.singletonList("MIXED");
    }

    private SeatSectionPurpose resolvePurpose(MeditationHallConfig config) {
        if (config.getGenderType() == null) {
            return SeatSectionPurpose.MIXED;
        }
        switch (config.getGenderType().toUpperCase()) {
            case "M":
                return SeatSectionPurpose.MIXED; // 实际用途在算法阶段区分
            case "F":
                return SeatSectionPurpose.MIXED;
            default:
                return SeatSectionPurpose.MIXED;
        }
    }

    private NumberingMode resolveNumbering(String numberingType) {
        if (!StringUtils.hasText(numberingType)) {
            return NumberingMode.SEQUENTIAL;
        }
        switch (numberingType.toUpperCase(Locale.ROOT)) {
            case "ODD":
                return NumberingMode.ODD;
            case "EVEN":
                return NumberingMode.EVEN;
            case "AB" :
            case "AB_SPLIT":
                return NumberingMode.AB_SPLIT;
            default:
                return NumberingMode.SEQUENTIAL;
        }
    }

    private String resolveUsageMode(MeditationHallConfig config) {
        if (StringUtils.hasText(config.getHallUsage())) {
            return config.getHallUsage();
        }
        return "SINGLE";
    }

    private String key(Integer row, Integer col) {
        return row + ":" + col;
    }

    private int safeInt(Integer value, int fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }
}

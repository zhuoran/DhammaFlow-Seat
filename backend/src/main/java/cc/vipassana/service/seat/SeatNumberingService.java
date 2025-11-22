package cc.vipassana.service.seat;

import cc.vipassana.dto.layout.NumberingConfig;
import cc.vipassana.dto.layout.NumberingMode;
import cc.vipassana.dto.layout.SeatCell;
import cc.vipassana.dto.layout.SeatSection;
import cc.vipassana.dto.layout.SeatSectionPurpose;
import cc.vipassana.entity.MeditationSeat;
import cc.vipassana.mapper.MeditationSeatMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeatNumberingService {

    private final MeditationSeatMapper meditationSeatMapper;

    public void assignInitialNumbers(List<MeditationSeat> seats,
                                     Map<String, SeatSection> sections,
                                     NumberingConfig defaultConfig) {
        seats.sort(Comparator
                .comparing(MeditationSeat::getRowIndex)
                .thenComparing(MeditationSeat::getColIndex));

        NumberingConfig config = defaultConfig != null ? defaultConfig : NumberingConfig.builder().build();
        NumberingMode mode = config.getMode() != null ? config.getMode() : NumberingMode.SEQUENTIAL;

        if (mode == NumberingMode.AB_SPLIT) {
            // AB_SPLIT模式：每个区域独立编号
            assignWithRegionPrefix(seats, sections, config);
        } else {
            // 传统模式：全局计数
            assignGlobalSequential(seats, sections, config);
        }
    }

    private void assignGlobalSequential(List<MeditationSeat> seats,
                                        Map<String, SeatSection> sections,
                                        NumberingConfig defaultConfig) {
        int counter = 1;
        for (MeditationSeat seat : seats) {
            NumberingConfig config = resolveConfig(sections, seat, defaultConfig);
            String seatNumber = buildSeatNumber(config, counter);
            seat.setSeatNumber(seatNumber);
            counter++;
        }
    }

    private void assignWithRegionPrefix(List<MeditationSeat> seats,
                                        Map<String, SeatSection> sections,
                                        NumberingConfig config) {
        // 按区域分组
        Map<String, Integer> regionCounters = new java.util.HashMap<>();
        
        for (MeditationSeat seat : seats) {
            String regionCode = seat.getRegionCode();
            if (!StringUtils.hasText(regionCode)) {
                regionCode = ""; // 没有区域代码时使用空字符串
            }
            
            // 获取或初始化该区域的计数器
            int counter = regionCounters.getOrDefault(regionCode, 1);
            
            // 构建座位号：区域前缀 + 数字
            String seatNumber = buildRegionSeatNumber(regionCode, counter);
            seat.setSeatNumber(seatNumber);
            
            // 更新计数器
            regionCounters.put(regionCode, counter + 1);
        }
    }

    private String buildRegionSeatNumber(String regionCode, int counter) {
        if (StringUtils.hasText(regionCode)) {
            return regionCode + counter;
        }
        return String.valueOf(counter);
    }

    public void renumberFromDatabase(Long sessionId,
                                     Map<String, SeatSection> sections,
                                     NumberingConfig defaultConfig) {
        List<MeditationSeat> seats = meditationSeatMapper.selectBySessionId(sessionId);
        assignInitialNumbers(seats, sections, defaultConfig);
        for (MeditationSeat seat : seats) {
            meditationSeatMapper.update(seat);
        }
    }

    private NumberingConfig resolveConfig(Map<String, SeatSection> sections,
                                          MeditationSeat seat,
                                          NumberingConfig defaultConfig) {
        SeatSection section = sections.get(seat.getRegionCode());
        if (section != null && section.getNumberingOverride() != null) {
            return section.getNumberingOverride();
        }
        return defaultConfig;
    }

    private String buildSeatNumber(NumberingConfig config, int counter) {
        NumberingMode mode = config.getMode() != null ? config.getMode() : NumberingMode.SEQUENTIAL;
        int number = counter;
        if (mode == NumberingMode.ODD) {
            number = counter * 2 - 1;
        } else if (mode == NumberingMode.EVEN) {
            number = counter * 2;
        }
        String prefix = config.getPrefix();
        if (StringUtils.hasText(prefix)) {
            return prefix + number;
        }
        return String.valueOf(number);
    }
}

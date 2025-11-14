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

        int counter = 1;
        for (MeditationSeat seat : seats) {
            NumberingConfig config = resolveConfig(sections, seat, defaultConfig);
            String seatNumber = buildSeatNumber(config, counter);
            seat.setSeatNumber(seatNumber);
            counter++;
        }
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

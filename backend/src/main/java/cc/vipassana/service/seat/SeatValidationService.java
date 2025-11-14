package cc.vipassana.service.seat;

import cc.vipassana.entity.MeditationSeat;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class SeatValidationService {

    public List<String> validate(List<MeditationSeat> seats) {
        List<String> warnings = new ArrayList<>();
        warnings.addAll(checkDuplicateStudents(seats));
        warnings.addAll(checkSeatConflicts(seats));
        return warnings;
    }

    private List<String> checkDuplicateStudents(List<MeditationSeat> seats) {
        Map<Long, Long> studentCount = new HashMap<>();
        for (MeditationSeat seat : seats) {
            if (seat.getStudentId() == null) {
                continue;
            }
            studentCount.merge(seat.getStudentId(), 1L, Long::sum);
        }
        List<String> warnings = new ArrayList<>();
        studentCount.forEach((studentId, count) -> {
            if (count > 1) {
                warnings.add("学员 " + studentId + " 被分配到 " + count + " 个座位");
            }
        });
        return warnings;
    }

    private List<String> checkSeatConflicts(List<MeditationSeat> seats) {
        Set<String> positions = new HashSet<>();
        List<String> warnings = new ArrayList<>();
        for (MeditationSeat seat : seats) {
            String key = seat.getRegionCode() + ":" + seat.getRowIndex() + ":" + seat.getColIndex();
            if (!positions.add(key)) {
                warnings.add("座位冲突: " + key);
            }
        }
        return warnings;
    }
}

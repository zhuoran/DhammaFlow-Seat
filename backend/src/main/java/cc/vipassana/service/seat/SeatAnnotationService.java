package cc.vipassana.service.seat;

import cc.vipassana.dto.layout.HighlightRule;
import cc.vipassana.dto.layout.HallLayout;
import cc.vipassana.entity.MeditationSeat;
import cc.vipassana.entity.Student;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Component
@Slf4j
public class SeatAnnotationService {

    public void annotateSpecial( List<MeditationSeat> seats,
                                 List<Student> students,
                                 HallLayout layout) {
        if (CollectionUtils.isEmpty(layout.getHighlightRules())) {
            return;
        }
        Map<Long, Student> studentMap = students.stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        for (MeditationSeat seat : seats) {
            if (seat.getStudentId() == null) {
                continue;
            }
            Student student = studentMap.get(seat.getStudentId());
            if (student == null) {
                continue;
            }
            for (HighlightRule rule : layout.getHighlightRules()) {
                if (matches(rule, student)) {
                    seat.setStatus(rule.getTag());
                    break;
                }
            }
        }
    }

    private boolean matches(HighlightRule rule, Student student) {
        if (rule.getExpression() == null) {
            return false;
        }
        String expr = rule.getExpression().toLowerCase();
        if (expr.contains("age>=") || expr.contains("age>") ) {
            return checkAge(expr, student.getAge());
        }
        if (expr.contains("pregnant")) {
            return student.getSpecialNotes() != null
                    && student.getSpecialNotes().contains("孕");
        }
        return false;
    }

    private boolean checkAge(String expr, Integer age) {
        if (age == null) {
            return false;
        }
        try {
            if (expr.contains(">=")) {
                int value = Integer.parseInt(expr.split(">=")[1].trim());
                return age >= value;
            }
            if (expr.contains(">")) {
                int value = Integer.parseInt(expr.split(">")[1].trim());
                return age > value;
            }
        } catch (NumberFormatException e) {
            log.warn("解析年龄表达式失败: {}", expr, e);
        }
        return false;
    }
}

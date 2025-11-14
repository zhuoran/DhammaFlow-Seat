package cc.vipassana.service.seat;

import cc.vipassana.dto.layout.CompiledLayout;
import cc.vipassana.dto.layout.SeatAllocationContext;
import cc.vipassana.dto.layout.SeatCell;
import cc.vipassana.dto.layout.SeatSectionPurpose;
import cc.vipassana.entity.MeditationHallConfig;
import cc.vipassana.entity.MeditationSeat;
import cc.vipassana.entity.Student;
import cc.vipassana.service.layout.LayoutCompiler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeatAllocator {

    private final LayoutCompiler layoutCompiler;

    public SeatAllocationContext buildContext(MeditationHallConfig config, List<Student> students) {
        CompiledLayout layout = layoutCompiler.compile(config);
        List<Student> monks = new ArrayList<>();
        List<Student> oldStudents = new ArrayList<>();
        List<Student> newStudents = new ArrayList<>();

        for (Student student : students) {
            if ("monk".equals(student.getStudentType())) {
                monks.add(student);
            } else if ("old_student".equals(student.getStudentType())) {
                oldStudents.add(student);
            } else {
                newStudents.add(student);
            }
        }

        sortOldStudents(oldStudents);
        sortNewStudents(newStudents);

        return SeatAllocationContext.builder()
                .layout(layout)
                .monks(monks)
                .oldStudents(oldStudents)
                .newStudents(newStudents)
                .build();
    }

    public AllocationResult allocate(MeditationHallConfig config,
                                     SeatAllocationContext context,
                                     Long sessionId,
                                     List<String> warnings) {
        List<MeditationSeat> seats = new ArrayList<>();
        List<Student> unassigned = new ArrayList<>();

        Iterator<Student> monkIterator = context.getMonks().iterator();
        Iterator<Student> oldIterator = context.getOldStudents().iterator();
        Iterator<Student> newIterator = context.getNewStudents().iterator();

        for (SeatCell cell : context.getLayout().getCells()) {
            if (cell.isReserved()) {
                continue;
            }
            Student target = null;
            SeatSectionPurpose purpose = cell.getPurpose();
            if (purpose == SeatSectionPurpose.MONK && monkIterator.hasNext()) {
                target = monkIterator.next();
            } else if (purpose == SeatSectionPurpose.OLD_STUDENT && oldIterator.hasNext()) {
                target = oldIterator.next();
            } else if (purpose == SeatSectionPurpose.NEW_STUDENT && newIterator.hasNext()) {
                target = newIterator.next();
            } else if (purpose == SeatSectionPurpose.MIXED) {
                if (oldIterator.hasNext()) {
                    target = oldIterator.next();
                } else if (newIterator.hasNext()) {
                    target = newIterator.next();
                }
            }

            if (target == null) {
                continue;
            }

            seats.add(buildSeat(sessionId, config, cell, target));
        }

        addRemaining(oldIterator, unassigned);
        addRemaining(newIterator, unassigned);
        addRemaining(monkIterator, unassigned);

        if (!unassigned.isEmpty()) {
            warnings.add("禅堂容量不足，未分配" + unassigned.size() + "人");
        }

        return new AllocationResult(seats, unassigned);
    }

    private MeditationSeat buildSeat(Long sessionId,
                                     MeditationHallConfig config,
                                     SeatCell cell,
                                     Student student) {
        return MeditationSeat.builder()
                .sessionId(sessionId)
                .centerId(config.getCenterId())
                .hallConfigId(config.getId())
                .hallId(config.getId())
                .studentId(student.getId())
                .seatType(resolveSeatType(cell.getPurpose()))
                .isOldStudent("old_student".equals(student.getStudentType()))
                .gender(student.getGender())
                .ageGroup(student.getAgeGroup())
                .regionCode(config.getRegionCode())
                .rowIndex(cell.getRow())
                .colIndex(cell.getCol())
                .status("allocated")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private String resolveSeatType(SeatSectionPurpose purpose) {
        if (purpose == SeatSectionPurpose.MONK) {
            return "MONK";
        }
        if (purpose == SeatSectionPurpose.WORKER) {
            return "WORKER";
        }
        return "STUDENT";
    }

    private void sortOldStudents(List<Student> oldStudents) {
        oldStudents.sort((a, b) -> {
            int experienceDiff = Integer.compare(
                    safeInt(b.getTotalCourseTimes()),
                    safeInt(a.getTotalCourseTimes())
            );
            if (experienceDiff != 0) {
                return experienceDiff;
            }
            return Integer.compare(safeInt(b.getAge()), safeInt(a.getAge()));
        });
    }

    private void sortNewStudents(List<Student> newStudents) {
        newStudents.sort((a, b) -> Integer.compare(safeInt(b.getAge()), safeInt(a.getAge())));
    }

    private void addRemaining(Iterator<Student> iterator, List<Student> target) {
        while (iterator.hasNext()) {
            target.add(iterator.next());
        }
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    @RequiredArgsConstructor
    public static class AllocationResult {
        private final List<MeditationSeat> seats;
        private final List<Student> unassigned;

        public List<MeditationSeat> seats() {
            return seats;
        }

        public List<Student> unassignedStudents() {
            return unassigned;
        }
    }
}

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
import org.springframework.util.StringUtils;

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
        List<Student> maleOldStudents = new ArrayList<>();
        List<Student> femaleOldStudents = new ArrayList<>();
        List<Student> maleNewStudents = new ArrayList<>();
        List<Student> femaleNewStudents = new ArrayList<>();

        for (Student student : students) {
            String inferredType = inferStudentType(student);
            if ("monk".equals(inferredType)) {
                monks.add(student);
                continue;
            }

            boolean isMale = "M".equalsIgnoreCase(student.getGender());
            if ("old_student".equals(inferredType)) {
                if (isMale) {
                    maleOldStudents.add(student);
                } else {
                    femaleOldStudents.add(student);
                }
            } else {
                if (isMale) {
                    maleNewStudents.add(student);
                } else {
                    femaleNewStudents.add(student);
                }
            }
        }

        sortOldStudents(maleOldStudents);
        sortOldStudents(femaleOldStudents);
        sortNewStudents(maleNewStudents);
        sortNewStudents(femaleNewStudents);

        List<Student> oldStudents = new ArrayList<>();
        oldStudents.addAll(maleOldStudents);
        oldStudents.addAll(femaleOldStudents);

        List<Student> newStudents = new ArrayList<>();
        newStudents.addAll(maleNewStudents);
        newStudents.addAll(femaleNewStudents);

        return SeatAllocationContext.builder()
                .layout(layout)
                .monks(monks)
                .oldStudents(oldStudents)
                .newStudents(newStudents)
                .maleOldStudents(maleOldStudents)
                .femaleOldStudents(femaleOldStudents)
                .maleNewStudents(maleNewStudents)
                .femaleNewStudents(femaleNewStudents)
                .build();
    }

    public AllocationResult allocate(MeditationHallConfig config,
                                     SeatAllocationContext context,
                                     Long sessionId,
                                     List<String> warnings) {
        // 基于布局分两段：先填旧生（OLD_STUDENT/MIXED），再填新生（NEW_STUDENT/MIXED，右到左，竖列）
        List<MeditationSeat> seats = new ArrayList<>();
        List<Student> unassigned = new ArrayList<>();

        List<SeatCell> cells = context.getLayout().getCells();
        // 按区分性别：A/男区填男，B/女区填女；每区“旧生前排，新生右->左竖列”
        List<SeatCell> femaleCells = new ArrayList<>();
        List<SeatCell> maleCells = new ArrayList<>();

        for (SeatCell cell : cells) {
            if (cell.isReserved()) {
                continue;
            }
            String seatGender = resolveSeatGender(cell, config);
            if ("F".equalsIgnoreCase(seatGender)) {
                femaleCells.add(cell);
            } else if ("M".equalsIgnoreCase(seatGender)) {
                maleCells.add(cell);
            } else {
                // 未识别性别的混合区，默认放在女区，保证不丢弃
                femaleCells.add(cell);
            }
        }

        Iterator<Student> monkIterator = context.getMonks().iterator();
        Iterator<Student> maleOldIterator = context.getMaleOldStudents().iterator();
        Iterator<Student> femaleOldIterator = context.getFemaleOldStudents().iterator();
        Iterator<Student> maleNewIterator = context.getMaleNewStudents().iterator();
        Iterator<Student> femaleNewIterator = context.getFemaleNewStudents().iterator();

        allocateBySection(seats, maleCells, "M", maleOldIterator, femaleOldIterator, maleNewIterator, femaleNewIterator, sessionId, config);
        allocateBySection(seats, femaleCells, "F", maleOldIterator, femaleOldIterator, maleNewIterator, femaleNewIterator, sessionId, config);

        addRemaining(femaleOldIterator, unassigned);
        addRemaining(maleOldIterator, unassigned);
        addRemaining(femaleNewIterator, unassigned);
        addRemaining(maleNewIterator, unassigned);
        addRemaining(monkIterator, unassigned);

        if (!unassigned.isEmpty()) {
            warnings.add("禅堂容量不足，未分配" + unassigned.size() + "人");
        }

        return new AllocationResult(seats, unassigned);
    }

    private MeditationSeat buildSeat(Long sessionId,
                                     MeditationHallConfig config,
                                     SeatCell cell,
                                     Student student,
                                     String regionCode,
                                     String seatGender) {
        boolean hasStudent = student != null;
        String resolvedGender = hasStudent && student.getGender() != null
                ? student.getGender()
                : seatGender;

        return MeditationSeat.builder()
                .sessionId(sessionId)
                .centerId(config.getCenterId())
                .hallConfigId(config.getId())
                .hallId(config.getId())
                .studentId(hasStudent ? student.getId() : null)
                .seatType(resolveSeatType(cell.getPurpose()))
                .isOldStudent(hasStudent ? "old_student".equals(inferStudentType(student)) : null)
                .gender(resolvedGender)
                .ageGroup(hasStudent ? student.getAgeGroup() : null)
                .regionCode(regionCode)
                .rowIndex(cell.getRow())
                .colIndex(cell.getCol())
                .status(hasStudent ? "allocated" : "available")
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

    private Student nextIfAvailable(Iterator<Student> iterator) {
        return iterator != null && iterator.hasNext() ? iterator.next() : null;
    }

    private Student pickOldStudent(String seatGender,
                                   Iterator<Student> maleOldIterator,
                                   Iterator<Student> femaleOldIterator) {
        if ("F".equalsIgnoreCase(seatGender)) {
            return nextIfAvailable(femaleOldIterator);
        }
        if ("M".equalsIgnoreCase(seatGender)) {
            return nextIfAvailable(maleOldIterator);
        }
        Student candidate = nextIfAvailable(femaleOldIterator);
        if (candidate != null) {
            return candidate;
        }
        return nextIfAvailable(maleOldIterator);
    }

    private Student pickNewStudent(String seatGender,
                                   Iterator<Student> maleNewIterator,
                                   Iterator<Student> femaleNewIterator) {
        if ("F".equalsIgnoreCase(seatGender)) {
            return nextIfAvailable(femaleNewIterator);
        }
        if ("M".equalsIgnoreCase(seatGender)) {
            return nextIfAvailable(maleNewIterator);
        }
        Student candidate = nextIfAvailable(femaleNewIterator);
        if (candidate != null) {
            return candidate;
        }
        return nextIfAvailable(maleNewIterator);
    }

    private Student pickMixedStudent(String seatGender,
                                     Iterator<Student> maleOldIterator,
                                     Iterator<Student> femaleOldIterator,
                                     Iterator<Student> maleNewIterator,
                                     Iterator<Student> femaleNewIterator) {
        if ("F".equalsIgnoreCase(seatGender)) {
            Student target = nextIfAvailable(femaleOldIterator);
            if (target != null) {
                return target;
            }
            return nextIfAvailable(femaleNewIterator);
        }
        if ("M".equalsIgnoreCase(seatGender)) {
            Student target = nextIfAvailable(maleOldIterator);
            if (target != null) {
                return target;
            }
            return nextIfAvailable(maleNewIterator);
        }

        // 性别未限定时，按照旧生→新生、女→男的顺序填充
        Student target = nextIfAvailable(femaleOldIterator);
        if (target != null) {
            return target;
        }
        target = nextIfAvailable(maleOldIterator);
        if (target != null) {
            return target;
        }
        target = nextIfAvailable(femaleNewIterator);
        if (target != null) {
            return target;
        }
        return nextIfAvailable(maleNewIterator);
    }

    private String resolveSeatGender(SeatCell cell, MeditationHallConfig config) {
        String sectionName = cell.getSectionName();
        if (StringUtils.hasText(sectionName)) {
            if (sectionName.contains("女")) {
                return "F";
            }
            if (sectionName.contains("男")) {
                return "M";
            }
            String upper = sectionName.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("A")) {
                return "M";
            }
            if (upper.startsWith("B")) {
                return "F";
            }
        }

        if (StringUtils.hasText(config.getGenderType())) {
            String genderType = config.getGenderType().trim().toUpperCase(Locale.ROOT);
            if ("F".equals(genderType) || "FEMALE".equals(genderType)) {
                return "F";
            }
            if ("M".equals(genderType) || "MALE".equals(genderType)) {
                return "M";
            }
        }
        return null;
    }

    private void allocateBySection(List<MeditationSeat> seats,
                                   List<SeatCell> sectionCells,
                                   String genderCode,
                                   Iterator<Student> maleOldIterator,
                                   Iterator<Student> femaleOldIterator,
                                   Iterator<Student> maleNewIterator,
                                   Iterator<Student> femaleNewIterator,
                                   Long sessionId,
                                   MeditationHallConfig config) {
        if (sectionCells.isEmpty()) {
            return;
        }
        // 行号升序（rowIndex 越小越靠近法座，前端反转渲染），行内列升序填旧生
        Comparator<SeatCell> rowAscColAsc = Comparator
                .comparingInt(SeatCell::getRow)
                .thenComparingInt(SeatCell::getCol);
        // 新生：为了减少空洞，改为行号升序、列升序，优先填靠近法座且从左到右，剩余空位留在远处
        Comparator<SeatCell> newFillOrder = rowAscColAsc;

        List<SeatCell> sorted = new ArrayList<>(sectionCells);
        sorted.sort(rowAscColAsc);

        // 旧生
        for (SeatCell cell : sorted) {
            Student target = pickOldStudent(genderCode, maleOldIterator, femaleOldIterator);
            if (target == null) {
                continue;
            }
            seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
        }

        // 新生：找未占用的 cell，按列右->左竖列
        List<SeatCell> remaining = new ArrayList<>();
        for (SeatCell cell : sectionCells) {
            boolean occupied = seats.stream().anyMatch(s -> s.getRowIndex() == cell.getRow() && s.getColIndex() == cell.getCol());
            if (!occupied) {
                remaining.add(cell);
            }
        }
        remaining.sort(newFillOrder);
        for (SeatCell cell : remaining) {
            Student target = pickNewStudent(genderCode, maleNewIterator, femaleNewIterator);
            if (target == null) {
                continue;
            }
            seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
        }

        // 为本区未填充的 cell 生成空座位，便于前端展示和手动分配
        fillEmptySeats(seats, sectionCells, sessionId, config, genderCode);
    }

    private void fillEmptySeats(List<MeditationSeat> seats,
                                List<SeatCell> sectionCells,
                                Long sessionId,
                                MeditationHallConfig config,
                                String genderCode) {
        for (SeatCell cell : sectionCells) {
            boolean occupied = seats.stream()
                    .anyMatch(s -> Objects.equals(s.getRowIndex(), cell.getRow())
                            && Objects.equals(s.getColIndex(), cell.getCol()));
            if (occupied) {
                continue;
            }
            seats.add(buildSeat(sessionId, config, cell, null, resolveRegionCode(cell, config), genderCode));
        }
    }

    private String resolveRegionCode(SeatCell cell, MeditationHallConfig config) {
        String sectionName = cell.getSectionName();
        if (StringUtils.hasText(sectionName)) {
            String upper = sectionName.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("A")) {
                return "A";
            }
            if (upper.startsWith("B")) {
                return "B";
            }
            if (sectionName.contains("女")) {
                return "B";
            }
            if (sectionName.contains("男")) {
                return "A";
            }
        }
        if (StringUtils.hasText(config.getRegionCode())) {
            return config.getRegionCode();
        }
        return "";
    }

    private String inferStudentType(Student student) {
        // 暂无显式字段时，根据 study_times 推断：>0 视为旧生，否则新生
        if (student.getName() != null && student.getName().startsWith("法")) {
            return "monk";
        }
        Integer times = student.getStudyTimes();
        if (times != null && times > 0) {
            return "old_student";
        }
        return "new_student";
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

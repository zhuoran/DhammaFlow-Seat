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
        List<Student> maleOldStudents = new ArrayList<>();
        List<Student> femaleOldStudents = new ArrayList<>();
        List<Student> maleNewStudents = new ArrayList<>();
        List<Student> femaleNewStudents = new ArrayList<>();

        for (Student student : students) {
            boolean isMonk = student.isMonk();
            boolean isOld = isMonk || student.isOldStudent();
            boolean isMale = "M".equalsIgnoreCase(student.getGender());
            if (isOld) {
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
        List<MeditationSeat> seats = new ArrayList<>();
        List<Student> unassigned = new ArrayList<>();

        // 先按 section 分组，再在每个 section 内按性别拆组
        Map<String, List<SeatCell>> sectionGroups = new HashMap<>();
        for (SeatCell cell : context.getLayout().getCells()) {
            if (cell.isReserved()) {
                continue;
            }
            String key = StringUtils.hasText(cell.getSectionName()) ? cell.getSectionName() : "__DEFAULT__";
            sectionGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(cell);
        }

        Deque<Student> maleOldQueue = new ArrayDeque<>(context.getMaleOldStudents());
        Deque<Student> femaleOldQueue = new ArrayDeque<>(context.getFemaleOldStudents());
        Deque<Student> maleNewQueue = new ArrayDeque<>(context.getMaleNewStudents());
        Deque<Student> femaleNewQueue = new ArrayDeque<>(context.getFemaleNewStudents());

        for (Map.Entry<String, List<SeatCell>> entry : sectionGroups.entrySet()) {
            String sectionName = entry.getKey();
            List<SeatCell> cells = entry.getValue();

            List<SeatCell> maleCells = new ArrayList<>();
            List<SeatCell> femaleCells = new ArrayList<>();

            for (SeatCell cell : cells) {
                String seatGender = resolveSeatGender(cell, config);
                if (!StringUtils.hasText(seatGender) && StringUtils.hasText(config.getGenderType())) {
                    String normalized = config.getGenderType().trim().toUpperCase(Locale.ROOT);
                    if (normalized.startsWith("F")) {
                        seatGender = "F";
                    } else if (normalized.startsWith("M")) {
                        seatGender = "M";
                    }
                }
                if ("F".equalsIgnoreCase(seatGender)) {
                    femaleCells.add(cell);
                } else if ("M".equalsIgnoreCase(seatGender)) {
                    maleCells.add(cell);
                } else {
                    warnings.add("座位区未标明性别，默认放入女区，section=" + sectionName);
                    femaleCells.add(cell);
                }
            }

            allocateBySection(seats, maleCells, "M", maleOldQueue, femaleOldQueue, maleNewQueue, femaleNewQueue, sessionId, config, warnings,
                    maleOldQueue.size(), maleNewQueue.size());
            allocateBySection(seats, femaleCells, "F", maleOldQueue, femaleOldQueue, maleNewQueue, femaleNewQueue, sessionId, config, warnings,
                    femaleOldQueue.size(), femaleNewQueue.size());
        }

        addRemaining(femaleOldQueue, unassigned);
        addRemaining(maleOldQueue, unassigned);
        addRemaining(femaleNewQueue, unassigned);
        addRemaining(maleNewQueue, unassigned);

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
            boolean aMonk = a.isMonk();
            boolean bMonk = b.isMonk();
            if (aMonk != bMonk) {
                return aMonk ? -1 : 1;
            }
            int experienceDiff = Integer.compare(
                    safeInt(b.getStudyTimes()),
                    safeInt(a.getStudyTimes())
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

    private Student nextIfAvailable(Deque<Student> deque) {
        return deque != null ? deque.pollFirst() : null;
    }

    private Student pickOldStudent(String seatGender,
                                   Deque<Student> maleOldIterator,
                                   Deque<Student> femaleOldIterator) {
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
                                   Deque<Student> maleNewIterator,
                                   Deque<Student> femaleNewIterator) {
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
                                     Deque<Student> maleOldIterator,
                                     Deque<Student> femaleOldIterator,
                                     Deque<Student> maleNewIterator,
                                     Deque<Student> femaleNewIterator) {
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
                                   Deque<Student> maleOldIterator,
                                   Deque<Student> femaleOldIterator,
                                   Deque<Student> maleNewIterator,
                                   Deque<Student> femaleNewIterator,
                                   Long sessionId,
                                   MeditationHallConfig config,
                                   List<String> warnings,
                                   int oldCount,
                                   int newCount) {
        if (sectionCells.isEmpty()) {
            return;
        }

        // 计算区域行列范围（矩阵仅用于相对坐标归一化，容量以实际可坐格子数计算，避免通道/洞造成虚假空位）
        int minRow = sectionCells.stream().mapToInt(SeatCell::getRow).min().orElse(0);
        int maxRow = sectionCells.stream().mapToInt(SeatCell::getRow).max().orElse(0);
        int minCol = sectionCells.stream().mapToInt(SeatCell::getCol).min().orElse(0);
        int maxCol = sectionCells.stream().mapToInt(SeatCell::getCol).max().orElse(0);
        int rows = maxRow - minRow + 1;
        int cols = maxCol - minCol + 1;
        int capacity = sectionCells.size(); // 按实际可坐的格子数计算容量，避免矩形空洞

        // 容量警告
        int totalNeed = oldCount + newCount;
        if (totalNeed > capacity) {
            warnings.add("禅堂区域 " + genderCode + " 超出容量，最多 " + capacity + "，待分配 " + totalNeed);
        }

        // 将 cell 映射为矩阵，按 purpose 分类
        SeatCell[][] grid = new SeatCell[rows][cols];
        for (SeatCell cell : sectionCells) {
            int r = cell.getRow() - minRow;
            int c = cell.getCol() - minCol;
            grid[r][c] = cell;
        }

        Set<String> occupied = new HashSet<>();
        boolean oldExhausted = false;
        int lastOldRow = -1;
        int exhaustRow = -1;

        // 1) 旧生优先放 OLD_STUDENT 专区（若存在）
        List<SeatCell> oldPreferred = new ArrayList<>();
        for (SeatCell cell : sectionCells) {
            if (cell.getPurpose() == SeatSectionPurpose.OLD_STUDENT && !cell.isReserved()) {
                oldPreferred.add(cell);
            }
        }
        oldPreferred.sort(Comparator.comparingInt(SeatCell::getRow).thenComparingInt(SeatCell::getCol));
        for (SeatCell cell : oldPreferred) {
            Student target = pickOldStudent(genderCode, maleOldIterator, femaleOldIterator);
            if (target == null) {
                oldExhausted = true;
                break;
            }
            seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
            occupied.add(seatKey(cell));
            lastOldRow = Math.max(lastOldRow, cell.getRow() - minRow);
        }

        // 2) 旧生前两行 row-major（跳过保留/占用）
        for (int r = 0; r < Math.min(2, rows); r++) {
            if (oldExhausted) {
                break;
            }
            for (int c = 0; c < cols; c++) {
                SeatCell cell = grid[r][c];
                if (cell == null || cell.isReserved() || occupied.contains(seatKey(cell))) {
                    continue;
                }
                Student target = pickOldStudent(genderCode, maleOldIterator, femaleOldIterator);
                if (target == null) {
                    oldExhausted = true;
                    exhaustRow = r;
                    break;
                }
                seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
                occupied.add(seatKey(cell));
                lastOldRow = Math.max(lastOldRow, r);
            }
        }

        // 3) 旧生继续填，行优先，从第3行起，但保留最后一行给尾部
        for (int r = 2; r < rows - 1 && !oldExhausted; r++) { // rows-1 为最后一行预留
            for (int c = 0; c < cols; c++) {
                SeatCell cell = grid[r][c];
                if (cell == null || cell.isReserved() || occupied.contains(seatKey(cell))) {
                    continue;
                }
                Student target = pickOldStudent(genderCode, maleOldIterator, femaleOldIterator);
                if (target == null) {
                    oldExhausted = true;
                    exhaustRow = r;
                    break;
                }
                seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
                occupied.add(seatKey(cell));
                lastOldRow = Math.max(lastOldRow, r);
            }
        }

        int mandatoryOldRows = lastOldRow >= 0 ? Math.min(2, rows) : 0;
        int computedOldRows = lastOldRow + 1;
        int oldRowsFilled = Math.max(mandatoryOldRows, computedOldRows);

        // 3.5) 如果旧生在某行中途耗尽，先用新生补这一行的剩余列（从右到左），保证行内不留空
        if (exhaustRow >= 0 && exhaustRow < rows - 1) {
            for (int c = cols - 1; c >= 0; c--) {
                SeatCell cell = grid[exhaustRow][c];
                if (cell == null || cell.isReserved() || occupied.contains(seatKey(cell))) {
                    continue;
                }
                if (cell.getPurpose() == SeatSectionPurpose.OLD_STUDENT) {
                    continue;
                }
                Student target = pickNewStudent(genderCode, maleNewIterator, femaleNewIterator);
                if (target == null) {
                    break;
                }
                seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
                occupied.add(seatKey(cell));
            }
        }

        // 4) 新生竖列：起始行为 oldRowsFilled，列从右到左，行从上到下（到 rows-2），填满每列再换列
        int startRow = Math.min(rows - 1, Math.max(0, oldRowsFilled));
        for (int c = cols - 1; c >= 0; c--) {
            for (int r = startRow; r < rows - 1; r++) { // 保留最后一行
                SeatCell cell = grid[r][c];
                if (cell == null || cell.isReserved() || occupied.contains(seatKey(cell))) {
                    continue;
                }
                if (cell.getPurpose() == SeatSectionPurpose.OLD_STUDENT) {
                    continue;
                }
                Student target = pickNewStudent(genderCode, maleNewIterator, femaleNewIterator);
                if (target == null) {
                    break;
                }
                seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
                occupied.add(seatKey(cell));
            }
        }

        // 5) 最后一行按行填剩余的旧/新生（允许留空位）
        int lastRow = rows - 1;
        for (int c = 0; c < cols; c++) {
            SeatCell cell = grid[lastRow][c];
            if (cell == null || cell.isReserved() || occupied.contains(seatKey(cell))) {
                continue;
            }
            Student target = pickOldStudent(genderCode, maleOldIterator, femaleOldIterator);
            if (target == null) {
                target = pickNewStudent(genderCode, maleNewIterator, femaleNewIterator);
            }
            if (target == null) {
                continue; // 最后一行允许留空
            }
            seats.add(buildSeat(sessionId, config, cell, target, resolveRegionCode(cell, config), genderCode));
            occupied.add(seatKey(cell));
        }

        // 6) 剩余空位补空座
        fillEmptySeats(seats, sectionCells, sessionId, config, genderCode, occupied);
    }

    private void fillEmptySeats(List<MeditationSeat> seats,
                                List<SeatCell> sectionCells,
                                Long sessionId,
                                MeditationHallConfig config,
                                String genderCode,
                                Set<String> occupiedKeys) {
        for (SeatCell cell : sectionCells) {
            if (cell.isReserved() || occupiedKeys.contains(seatKey(cell))) {
                continue;
            }
            seats.add(buildSeat(sessionId, config, cell, null, resolveRegionCode(cell, config), genderCode));
            occupiedKeys.add(seatKey(cell));
        }
    }

    private String seatKey(SeatCell cell) {
        return cell.getRow() + ":" + cell.getCol();
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

    private void addRemaining(Deque<Student> deque, List<Student> target) {
        Student next;
        while ((next = nextIfAvailable(deque)) != null) {
            target.add(next);
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

package cc.vipassana.service.impl;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.MeditationSeatService;
import cc.vipassana.service.layout.LayoutCompiler;
import cc.vipassana.dto.layout.CompiledLayout;
import cc.vipassana.dto.layout.SeatAllocationContext;
import cc.vipassana.service.seat.SeatAllocator;
import cc.vipassana.service.seat.SeatAnnotationService;
import cc.vipassana.service.seat.SeatNumberingService;
import cc.vipassana.service.seat.SeatValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 禅堂座位业务服务实现
 * 负责座位生成、分配和管理
 */
@Slf4j
@Service
public class MeditationSeatServiceImpl implements MeditationSeatService {

    @Autowired
    private MeditationSeatMapper meditationSeatMapper;

    @Autowired
    private MeditationHallConfigMapper meditationHallConfigMapper;

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private AllocationMapper allocationMapper;

    @Autowired
    private SessionMapper sessionMapper;

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private LayoutCompiler layoutCompiler;

    @Autowired
    private SeatAllocator seatAllocator;

    @Autowired
    private SeatNumberingService seatNumberingService;

    @Autowired
    private SeatAnnotationService seatAnnotationService;

    @Autowired
    private SeatValidationService seatValidationService;

    @Override
    @Transactional
    public List<MeditationSeat> generateSeats(Long sessionId) {
        log.info("开始生成禅堂座位，期次ID: {}", sessionId);

        List<MeditationSeat> generatedSeats = new ArrayList<>();

        try {
            List<String> warnings = new ArrayList<>();
            // 1. 获取session信息
            Session session = sessionMapper.selectById(sessionId);
            if (session == null) {
                log.warn("期次 {} 不存在", sessionId);
                return generatedSeats;
            }
            // 2. 获取禅堂配置
            List<MeditationHallConfig> hallConfigs = meditationHallConfigMapper.selectBySessionId(sessionId);
            // 只保留 layout_config 非空的配置
            hallConfigs.removeIf(cfg -> !StringUtils.hasText(cfg.getLayoutConfig()));
            if (hallConfigs.size() != 1) {
                log.warn("期次 {} 禅堂配置异常，找到 {} 条有效配置", sessionId, hallConfigs.size());
                throw new RuntimeException("禅堂配置异常：需要且仅允许一条有效配置");
            }

            // 2. 获取该期次所有学员的分配信息（批量查询优化）
            List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
            Map<Long, Allocation> allocationMap = allocations.stream()
                    .collect(Collectors.toMap(Allocation::getStudentId, a -> a));
            Map<Long, String> roomNumberMap = loadRoomNumberMap(allocations);

            List<Long> studentIds = allocations.stream()
                    .map(Allocation::getStudentId)
                    .collect(Collectors.toList());

            List<Student> students = studentIds.isEmpty() ?
                    new ArrayList<>() :
                    studentMapper.selectByIds(studentIds);

            log.info("期次 {} 已分配学员 {} 名", sessionId, students.size());

            // 3. 按区域和性别分组学员
            for (MeditationHallConfig config : hallConfigs) {
                CompiledLayout compiledLayout = layoutCompiler.compile(config);
                List<Student> regionStudents = filterStudentsByRegion(students, config.getGenderType());

                SeatAllocationContext context = seatAllocator.buildContext(config, regionStudents);
                SeatAllocator.AllocationResult result = seatAllocator.allocate(config, context, sessionId, warnings);
                List<MeditationSeat> regionSeats = result.seats();
                seatNumberingService.assignInitialNumbers(regionSeats,
                        compiledLayout.getSections(),
                        compiledLayout.getSource().getNumbering());
                seatAnnotationService.annotateSpecial(regionSeats,
                        regionStudents,
                        compiledLayout.getSource());
                bindBedCodes(regionSeats, allocationMap, roomNumberMap);
                meditationSeatMapper.insertBatch(regionSeats);
                generatedSeats.addAll(regionSeats);

                log.info("禅堂区域 {} 座位生成完成，共 {} 个座位",
                        config.getRegionCode(), regionSeats.size());
            }

            List<String> validationWarnings = seatValidationService.validate(generatedSeats);
            warnings.addAll(validationWarnings);

            if (!warnings.isEmpty()) {
                warnings.forEach(w -> log.warn("期次 {} 生成警告: {}", sessionId, w));
            }
            log.info("禅堂座位生成完成，期次ID: {}，共生成 {} 个座位", sessionId, generatedSeats.size());
            return generatedSeats;

        } catch (Exception e) {
            log.error("生成禅堂座位失败，期次ID: {}", sessionId, e);
            throw new RuntimeException("生成禅堂座位失败: " + e.getMessage());
        }
    }

    private List<Student> filterStudentsByRegion(List<Student> students, String genderType) {
        if (genderType == null || "mixed".equalsIgnoreCase(genderType)) {
            return students;
        }

        return students.stream()
                .filter(s -> genderType.equalsIgnoreCase(s.getGender()))
                .collect(Collectors.toList());
    }

    private void bindBedCodes(List<MeditationSeat> seats,
                              Map<Long, Allocation> allocationMap,
                              Map<Long, String> roomNumberMap) {
        for (MeditationSeat seat : seats) {
            if (seat.getStudentId() == null) {
                continue;
            }
            Allocation allocation = allocationMap.get(seat.getStudentId());
            if (allocation == null) {
                continue;
            }
            seat.setBedCode(buildBedCode(allocation, roomNumberMap));
        }
    }

    private String buildBedCode(Allocation allocation, Map<Long, String> roomNumberMap) {
        if (allocation.getRoomId() == null || allocation.getBedNumber() == null) {
            return null;
        }
        String roomNumber = roomNumberMap.getOrDefault(allocation.getRoomId(),
                String.valueOf(allocation.getRoomId()));
        return roomNumber + "-" + allocation.getBedNumber();
    }

    private Map<Long, String> loadRoomNumberMap(List<Allocation> allocations) {
        Set<Long> roomIds = allocations.stream()
                .map(Allocation::getRoomId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> roomMap = new HashMap<>();
        if (roomIds.isEmpty()) {
            return roomMap;
        }
        for (Room room : roomMapper.selectAll()) {
            if (roomIds.contains(room.getId())) {
                roomMap.put(room.getId(), room.getRoomNumber());
            }
        }
        return roomMap;
    }

    @Override
    public List<MeditationSeat> getSeats(Long sessionId) {
        return meditationSeatMapper.selectBySessionId(sessionId);
    }

    @Override
    public List<MeditationSeat> getSeatsByRegion(Long sessionId, String regionCode) {
        List<MeditationSeat> allSeats = meditationSeatMapper.selectBySessionId(sessionId);
        return allSeats.stream()
                .filter(s -> regionCode.equals(s.getRegionCode()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void swapSeats(Long seatId1, Long seatId2) {
        MeditationSeat seat1 = meditationSeatMapper.selectById(seatId1);
        MeditationSeat seat2 = meditationSeatMapper.selectById(seatId2);

        if (seat1 == null || seat2 == null) {
            throw new RuntimeException("座位不存在");
        }

        Long studentId1 = seat1.getStudentId();
        Long studentId2 = seat2.getStudentId();

        if (studentId1 == null && studentId2 == null) {
            throw new RuntimeException("两个座位都为空，无需交换");
        }

        // 冲突检测：检查交换后是否会导致同伴相邻
        if (studentId1 != null && studentId2 != null) {
            Student student1 = studentMapper.selectById(studentId1);
            Student student2 = studentMapper.selectById(studentId2);

            if (student1 != null && student2 != null &&
                    student1.getFellowGroupId() != null &&
                    student1.getFellowGroupId().equals(student2.getFellowGroupId())) {
                throw new RuntimeException("不能交换同伴组成员的座位");
            }
        }

        // 交换学员
        seat1.setStudentId(studentId2);
        seat2.setStudentId(studentId1);
        seat1.setUpdatedAt(LocalDateTime.now());
        seat2.setUpdatedAt(LocalDateTime.now());

        meditationSeatMapper.update(seat1);
        meditationSeatMapper.update(seat2);

        // 更新同伴座位关系
        updateCompanionRelations(seat1);
        updateCompanionRelations(seat2);

        log.info("座位交换成功: {} <-> {}", seatId1, seatId2);
    }

    /**
     * 更新座位的同伴关系
     */
    private void updateCompanionRelations(MeditationSeat seat) {
        if (seat.getStudentId() == null) {
            seat.setIsWithCompanion(false);
            seat.setCompanionSeatId(null);
            meditationSeatMapper.update(seat);
            return;
        }

        Student student = studentMapper.selectById(seat.getStudentId());
        if (student == null || student.getFellowGroupId() == null) {
            seat.setIsWithCompanion(false);
            seat.setCompanionSeatId(null);
            meditationSeatMapper.update(seat);
            return;
        }

        // 查找同一区域的所有座位
        List<MeditationSeat> regionSeats = meditationSeatMapper.selectBySessionId(seat.getSessionId())
                .stream()
                .filter(s -> seat.getRegionCode().equals(s.getRegionCode()))
                .collect(Collectors.toList());

        // 查找同伴座位
        for (MeditationSeat other : regionSeats) {
            if (other.getId().equals(seat.getId()) || other.getStudentId() == null) {
                continue;
            }

            Student otherStudent = studentMapper.selectById(other.getStudentId());
            if (otherStudent != null &&
                    student.getFellowGroupId().equals(otherStudent.getFellowGroupId()) &&
                    isAdjacentSeats(seat, other)) {
                seat.setIsWithCompanion(true);
                seat.setCompanionSeatId(other.getId());
                meditationSeatMapper.update(seat);
                return;
            }
        }

        seat.setIsWithCompanion(false);
        seat.setCompanionSeatId(null);
        meditationSeatMapper.update(seat);
    }

    @Override
    @Transactional
    public void assignSeat(Long studentId, Long seatId) {
        try {
            MeditationSeat seat = meditationSeatMapper.selectById(seatId);

            if (seat == null) {
                throw new RuntimeException("座位不存在");
            }

            Student student = studentMapper.selectById(studentId);

            if (student == null) {
                throw new RuntimeException("学员不存在");
            }

            seat.setStudentId(studentId);
            seat.setUpdatedAt(LocalDateTime.now());
            seat.setStatus("allocated");

            meditationSeatMapper.update(seat);

            log.info("座位分配成功: 学员 {} 分配到座位 {}", studentId, seatId);

        } catch (Exception e) {
            log.error("座位分配失败", e);
            throw new RuntimeException("座位分配失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteSessionSeats(Long sessionId) {
        try {
            int deletedCount = meditationSeatMapper.deleteBySessionId(sessionId);
            log.info("期次 {} 的座位已删除，共删除 {} 个座位", sessionId, deletedCount);
        } catch (Exception e) {
            log.error("删除座位失败，期次ID: {}", sessionId, e);
            throw new RuntimeException("删除座位失败: " + e.getMessage());
        }
    }

    @Override
    public SeatStatistics getStatistics(Long sessionId) {
        try {
            List<MeditationSeat> seats = meditationSeatMapper.selectBySessionId(sessionId);

            SeatStatistics stats = new SeatStatistics();
            stats.totalSeats = seats.size();
            stats.occupiedSeats = (int) seats.stream()
                    .filter(s -> s.getStudentId() != null)
                    .count();
            stats.availableSeats = stats.totalSeats - stats.occupiedSeats;
            stats.occupancyRate = stats.totalSeats > 0 ?
                    (double) stats.occupiedSeats / stats.totalSeats : 0.0;
            stats.unassignedStudents = 0;
            stats.warnings = Collections.emptyList();

            return stats;

        } catch (Exception e) {
            log.error("座位统计失败，期次ID: {}", sessionId, e);
            throw new RuntimeException("座位统计失败: " + e.getMessage());
        }
    }

    /**
     * 处理同伴座位标记（P1功能）
     * 识别学员的同伴，检查是否相邻，标记同伴关系
     *
     * @param seats 生成的所有座位列表
     * @param students 学员列表
     */
    private void processCompanionSeats(List<MeditationSeat> seats, List<Student> students) {
        log.info("开始处理同伴座位标记...");

        try {
            // 1. 构建座位映射：学员ID -> 座位对象
            Map<Long, MeditationSeat> studentSeatMap = new HashMap<>();
            for (MeditationSeat seat : seats) {
                if (seat.getStudentId() != null) {
                    studentSeatMap.put(seat.getStudentId(), seat);
                }
            }

            // 2. 构建学员映射：学员ID -> 学员对象
            Map<Long, Student> studentMap = new HashMap<>();
            for (Student student : students) {
                studentMap.put(student.getId(), student);
            }

            // 3. 按同伴组ID分组学员
            Map<Integer, List<Student>> companionGroups = students.stream()
                    .filter(s -> s.getFellowGroupId() != null)
                    .collect(Collectors.groupingBy(Student::getFellowGroupId));

            log.info("发现 {} 个同伴组", companionGroups.size());

            // 4. 处理每个同伴组
            int processedCompanions = 0;
            for (Map.Entry<Integer, List<Student>> entry : companionGroups.entrySet()) {
                List<Student> groupMembers = entry.getValue();

                // 同伴组中的每两个成员之间检查相邻关系
                for (int i = 0; i < groupMembers.size(); i++) {
                    for (int j = i + 1; j < groupMembers.size(); j++) {
                        Student student1 = groupMembers.get(i);
                        Student student2 = groupMembers.get(j);

                        MeditationSeat seat1 = studentSeatMap.get(student1.getId());
                        MeditationSeat seat2 = studentSeatMap.get(student2.getId());

                        // 检查两个座位是否都存在且相邻
                        if (seat1 != null && seat2 != null) {
                            if (isAdjacentSeats(seat1, seat2)) {
                                // 标记为同伴座位
                                seat1.setIsWithCompanion(true);
                                seat1.setCompanionSeatId(seat2.getId());
                                seat1.setUpdatedAt(LocalDateTime.now());

                                seat2.setIsWithCompanion(true);
                                seat2.setCompanionSeatId(seat1.getId());
                                seat2.setUpdatedAt(LocalDateTime.now());

                                // 更新数据库
                                meditationSeatMapper.update(seat1);
                                meditationSeatMapper.update(seat2);

                                processedCompanions++;
                                log.debug("同伴座位标记: 学员 {} 和 {} 相邻，座位 ({},{}) <-> ({},{})",
                                        student1.getName(), student2.getName(),
                                        seat1.getRowIndex(), seat1.getColIndex(),
                                        seat2.getRowIndex(), seat2.getColIndex());
                            } else {
                                // 同伴座位不相邻，记录警告
                                log.warn("同伴座位未相邻: 学员 {} 和 {} 不相邻，座位 ({},{}) 和 ({},{})",
                                        student1.getName(), student2.getName(),
                                        seat1.getRowIndex(), seat1.getColIndex(),
                                        seat2.getRowIndex(), seat2.getColIndex());
                            }
                        }
                    }
                }
            }

            log.info("同伴座位处理完成，已标记 {} 对相邻的同伴座位", processedCompanions);

        } catch (Exception e) {
            log.error("处理同伴座位标记失败", e);
            // 不抛出异常，允许座位生成继续
        }
    }

    /**
     * 检查两个座位是否相邻（上下或左右）
     *
     * @param seat1 座位1
     * @param seat2 座位2
     * @return true 如果相邻
     */
    private boolean isAdjacentSeats(MeditationSeat seat1, MeditationSeat seat2) {
        int row1 = seat1.getRowIndex() != null ? seat1.getRowIndex() : 0;
        int col1 = seat1.getColIndex() != null ? seat1.getColIndex() : 0;
        int row2 = seat2.getRowIndex() != null ? seat2.getRowIndex() : 0;
        int col2 = seat2.getColIndex() != null ? seat2.getColIndex() : 0;

        // 上下相邻：列相同，行差为1
        if (col1 == col2 && Math.abs(row1 - row2) == 1) {
            return true;
        }

        // 左右相邻：行相同，列差为1
        if (row1 == row2 && Math.abs(col1 - col2) == 1) {
            return true;
        }

        return false;
    }

    /**
     * 处理特殊学员标记（孕妇/老人）
     *
     * @param seats 生成的所有座位列表
     * @param students 学员列表
     * @param elderlyThreshold 老人年龄阈值
     */
    private void processSpecialStudents(List<MeditationSeat> seats, List<Student> students,
                                        int elderlyThreshold) {
        log.info("开始处理特殊学员标记，老人阈值: {} 岁", elderlyThreshold);

        Map<Long, Student> studentMap = students.stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        int pregnantCount = 0;
        int elderlyCount = 0;

        for (MeditationSeat seat : seats) {
            if (seat.getStudentId() == null) continue;

            Student student = studentMap.get(seat.getStudentId());
            if (student == null) continue;

            boolean updated = false;

            // 检查孕妇
            if (student.getSpecialNotes() != null &&
                    student.getSpecialNotes().contains("怀孕")) {
                seat.setStatus("pregnant");
                updated = true;
                pregnantCount++;
                log.debug("标记孕妇座位: {} -> {}", student.getName(), seat.getSeatNumber());
            }

            // 检查老人
            if (student.getAge() != null && student.getAge() >= elderlyThreshold) {
                if (!"pregnant".equals(seat.getStatus())) {
                    seat.setStatus("elderly");
                }
                updated = true;
                elderlyCount++;
                log.debug("标记老人座位: {} ({}岁) -> {}", student.getName(),
                        student.getAge(), seat.getSeatNumber());
            }

            if (updated) {
                seat.setUpdatedAt(LocalDateTime.now());
                meditationSeatMapper.update(seat);
            }
        }

        log.info("特殊学员标记完成: 孕妇 {} 人, 老人 {} 人", pregnantCount, elderlyCount);
    }
}

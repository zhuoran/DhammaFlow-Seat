package cc.vipassana.service.impl;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.MeditationSeatService;
import cc.vipassana.util.CompanionSeatHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public List<MeditationSeat> generateSeats(Long sessionId) {
        log.info("开始生成禅堂座位，期次ID: {}", sessionId);

        List<MeditationSeat> generatedSeats = new ArrayList<>();

        try {
            // 1. 获取禅堂配置
            List<MeditationHallConfig> hallConfigs = meditationHallConfigMapper.selectBySessionId(sessionId);

            if (hallConfigs.isEmpty()) {
                log.warn("期次 {} 没有禅堂配置", sessionId);
                return generatedSeats;
            }

            // 2. 获取该期次所有学员的分配信息（批量查询优化）
            List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);

            // 批量查询所有学员（优化N+1问题）
            List<Long> studentIds = allocations.stream()
                    .map(Allocation::getStudentId)
                    .collect(Collectors.toList());

            List<Student> students = studentIds.isEmpty() ?
                    new ArrayList<>() :
                    studentMapper.selectByIds(studentIds);

            log.info("期次 {} 已分配学员 {} 名", sessionId, students.size());

            // 3. 按区域和性别分组学员
            for (MeditationHallConfig config : hallConfigs) {
                List<Student> regionStudents = filterStudentsByRegion(students, config.getGenderType());

                // 生成该禅堂区域的座位
                List<MeditationSeat> regionSeats = generateRegionSeats(sessionId, config, regionStudents);
                generatedSeats.addAll(regionSeats);

                log.info("禅堂区域 {} 座位生成完成，共 {} 个座位",
                        config.getRegionCode(), regionSeats.size());
            }

            // 4. 处理同伴座位标记（P1功能）
            if (!generatedSeats.isEmpty()) {
                processCompanionSeats(generatedSeats, students);
            }

            log.info("禅堂座位生成完成，期次ID: {}，共生成 {} 个座位", sessionId, generatedSeats.size());
            return generatedSeats;

        } catch (Exception e) {
            log.error("生成禅堂座位失败，期次ID: {}", sessionId, e);
            throw new RuntimeException("生成禅堂座位失败: " + e.getMessage());
        }
    }

    private List<Student> filterStudentsByRegion(List<Student> students, String genderType) {
        if ("mixed".equals(genderType)) {
            return students;
        }

        return students.stream()
                .filter(s -> genderType.equals(s.getGender()))
                .collect(Collectors.toList());
    }

    /**
     * 生成禅堂座位 - 三阶段分配算法
     * 阶段1: 旧生座位 (前K行水平排列，优先级最高)
     * 阶段2: 新生座位 (剩余行数，从右到左竖列)
     * 阶段3: 法师座位 (左侧单列，行间距3行)
     */
    private List<MeditationSeat> generateRegionSeats(Long sessionId, MeditationHallConfig config,
                                                     List<Student> students) {
        List<MeditationSeat> seats = new ArrayList<>();

        // 第一步: 按优先级分组学员
        List<Student> monks = new ArrayList<>();
        List<Student> oldLayStudents = new ArrayList<>();
        List<Student> newLayStudents = new ArrayList<>();

        for (Student student : students) {
            if ("monk".equals(student.getStudentType())) {
                monks.add(student);
            } else if ("old_student".equals(student.getStudentType())) {
                oldLayStudents.add(student);
            } else {
                newLayStudents.add(student);
            }
        }

        // 对旧生排序: 按修学总次数降序，相同次数按年龄降序
        oldLayStudents.sort((a, b) -> {
            int experienceDiff = Integer.compare(
                    b.getTotalCourseTimes(),
                    a.getTotalCourseTimes()
            );
            if (experienceDiff != 0) return experienceDiff;
            // 年龄大的优先
            return Integer.compare(
                    b.getAge() != null ? b.getAge() : 0,
                    a.getAge() != null ? a.getAge() : 0
            );
        });

        // 对新生排序: 按年龄降序
        newLayStudents.sort((a, b) -> Integer.compare(
                b.getAge() != null ? b.getAge() : 0,
                a.getAge() != null ? a.getAge() : 0
        ));

        log.info("禅堂区域 {} 学员分组: 法师 {}名, 旧生 {}名, 新生 {}名",
                config.getRegionCode(), monks.size(), oldLayStudents.size(), newLayStudents.size());

        // 禅堂配置
        Integer regionWidth = config.getRegionWidth() != null ? config.getRegionWidth() : 8;
        Integer regionRows = config.getRegionRows() != null ? config.getRegionRows() : 10;
        final int MONK_ROW_OFFSET = 3;  // 法师座位行间距
        int seatIndex = 1;

        // ========== 阶段1: 旧生座位 (前K行，水平排列) ==========
        log.debug("开始分配旧生座位...");
        int oldStudentIndex = 0;
        int oldStudentRow = 0;
        int oldStudentCol = 0;

        while (oldStudentIndex < oldLayStudents.size()) {
            Student student = oldLayStudents.get(oldStudentIndex);
            String seatNumber = generateSeatNumber(config, seatIndex);

            MeditationSeat seat = MeditationSeat.builder()
                    .sessionId(sessionId)
                    .centerId(config.getCenterId())
                    .hallConfigId(config.getId())
                    .hallId(config.getId())
                    .seatNumber(seatNumber)
                    .studentId(student.getId())
                    .seatType("STUDENT")
                    .isOldStudent(true)
                    .gender(student.getGender())
                    .ageGroup(student.getAgeGroup())
                    .regionCode(config.getRegionCode())
                    .rowIndex(oldStudentRow)
                    .colIndex(oldStudentCol)
                    .status("allocated")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            meditationSeatMapper.insert(seat);
            seats.add(seat);
            log.debug("旧生座位分配: {} (位置 {},{}) -> {}",
                    seatNumber, oldStudentRow, oldStudentCol, student.getName());

            oldStudentCol++;
            if (oldStudentCol >= regionWidth) {
                oldStudentCol = 0;
                oldStudentRow++;
            }

            seatIndex++;
            oldStudentIndex++;
        }

        // 旧生座位结束位置
        int nextAvailableRow = oldStudentRow;

        // ========== 阶段2: 新生座位 (竖列，从右到左) ==========
        log.debug("开始分配新生座位...");
        int newStudentRow = nextAvailableRow;
        int newStudentCol = regionWidth - 1;  // 从最右列开始

        for (Student student : newLayStudents) {
            String seatNumber = generateSeatNumber(config, seatIndex);

            MeditationSeat seat = MeditationSeat.builder()
                    .sessionId(sessionId)
                    .centerId(config.getCenterId())
                    .hallConfigId(config.getId())
                    .hallId(config.getId())
                    .seatNumber(seatNumber)
                    .studentId(student.getId())
                    .seatType("STUDENT")
                    .isOldStudent(false)
                    .gender(student.getGender())
                    .ageGroup(student.getAgeGroup())
                    .regionCode(config.getRegionCode())
                    .rowIndex(newStudentRow)
                    .colIndex(newStudentCol)
                    .status("allocated")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            meditationSeatMapper.insert(seat);
            seats.add(seat);
            log.debug("新生座位分配: {} (位置 {},{}) -> {}",
                    seatNumber, newStudentRow, newStudentCol, student.getName());

            newStudentRow++;
            if (newStudentRow >= regionRows) {
                // 当前列满，移到左边下一列
                newStudentCol--;
                newStudentRow = nextAvailableRow;

                // 检查是否超出列范围
                if (newStudentCol < 0) {
                    log.warn("新生座位超出禅堂容量，regionWidth: {}, regionRows: {}", regionWidth, regionRows);
                    break;
                }
            }

            seatIndex++;
        }

        // ========== 阶段3: 法师座位 (左侧单列，行间距MONK_ROW_OFFSET) ==========
        log.debug("开始分配法师座位...");
        for (int i = 0; i < monks.size(); i++) {
            Student monk = monks.get(i);
            String seatNumber = "法" + (i + 1);
            int monkRow = i * MONK_ROW_OFFSET;
            int monkCol = 0;

            MeditationSeat seat = MeditationSeat.builder()
                    .sessionId(sessionId)
                    .centerId(config.getCenterId())
                    .hallConfigId(config.getId())
                    .hallId(config.getId())
                    .seatNumber(seatNumber)
                    .studentId(monk.getId())
                    .seatType("MONK")
                    .isOldStudent(false)
                    .gender(monk.getGender())
                    .ageGroup(monk.getAgeGroup())
                    .regionCode(config.getRegionCode())
                    .rowIndex(monkRow)
                    .colIndex(monkCol)
                    .status("allocated")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            meditationSeatMapper.insert(seat);
            seats.add(seat);
            log.debug("法师座位分配: {} (位置 {},{}) -> {}", seatNumber, monkRow, monkCol, monk.getName());
        }

        log.info("禅堂区域 {} 座位生成完成，共 {} 个座位 (旧生{}+新生{}+法师{})",
                config.getRegionCode(), seats.size(),
                oldLayStudents.size(), newLayStudents.size(), monks.size());

        return seats;
    }

    private String generateSeatNumber(MeditationHallConfig config, int seatNum) {
        String prefix = config.getSeatPrefix() != null ? config.getSeatPrefix() : "S";
        String numberingType = config.getNumberingType();

        if ("sequential".equals(numberingType)) {
            return prefix + seatNum;
        } else if ("odd".equals(numberingType)) {
            return prefix + (seatNum * 2 - 1);
        } else if ("even".equals(numberingType)) {
            return prefix + (seatNum * 2);
        } else {
            return prefix + seatNum;
        }
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
        try {
            MeditationSeat seat1 = meditationSeatMapper.selectById(seatId1);
            MeditationSeat seat2 = meditationSeatMapper.selectById(seatId2);

            if (seat1 == null || seat2 == null) {
                throw new RuntimeException("座位不存在");
            }

            Long tempStudentId = seat1.getStudentId();
            seat1.setStudentId(seat2.getStudentId());
            seat2.setStudentId(tempStudentId);

            seat1.setUpdatedAt(LocalDateTime.now());
            seat2.setUpdatedAt(LocalDateTime.now());

            meditationSeatMapper.update(seat1);
            meditationSeatMapper.update(seat2);

            log.info("座位交换成功: {} <-> {}", seatId1, seatId2);

        } catch (Exception e) {
            log.error("座位交换失败", e);
            throw new RuntimeException("座位交换失败: " + e.getMessage());
        }
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
}

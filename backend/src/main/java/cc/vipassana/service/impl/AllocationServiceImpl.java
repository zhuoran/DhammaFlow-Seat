package cc.vipassana.service.impl;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.AllocationService;
import cc.vipassana.service.allocation.CompanionSplitter;
import cc.vipassana.service.allocation.RoomCursor;
import cc.vipassana.service.allocation.RoomQueueBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 房间分配服务实现
 * 包含核心的分配算法
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationServiceImpl implements AllocationService {

    private final StudentMapper studentMapper;
    private final RoomMapper roomMapper;
    private final AllocationMapper allocationMapper;
    private final FellowRelationMapper fellowRelationMapper;
    private final MeditationSeatMapper meditationSeatMapper;
    private final MeditationHallConfigMapper meditationHallConfigMapper;

    /**
     * 核心分配算法入口
     */
    @Override
    @Transactional
    public AllocationService.AllocationResult autoAllocate(Long sessionId) {
        log.info("开始自动分配，期次ID: {}", sessionId);
        AllocationService.AllocationResult result = new AllocationService.AllocationResult();

        try {
            // 1. 获取并排序学员
            List<Student> sortedStudents = sortStudents(sessionId);
            result.totalStudents = sortedStudents.size();
            log.info("学员总数: {}", result.totalStudents);

            // 2. 清除之前的分配
            clearAllocations(sessionId);

            // 3. 执行床位分配
            double score = allocateBeds(sessionId, sortedStudents);
            result.allocatedCount = allocationMapper.countBySessionId(sessionId);
            log.info("已分配学员: {}", result.allocatedCount);

            // 4. 检测冲突
            List<AllocationService.AllocationConflict> conflicts = detectConflicts(sessionId);
            result.conflictCount = conflicts.size();
            log.info("检测到冲突: {}", result.conflictCount);

            // 5. 生成统计信息
            result.statistics = generateStatistics(sessionId, sortedStudents);

            // 6. 生成禅堂座位
            generateMeditationSeats(sessionId);

            // 7. 更新状态
            result.success = result.allocatedCount == result.totalStudents;
            result.message = result.success ?
                String.format("分配成功！分配学员数: %d, 冲突数: %d", result.allocatedCount, result.conflictCount) :
                String.format("部分分配失败。已分配: %d/%d", result.allocatedCount, result.totalStudents);

            log.info("分配完成: {}", result.message);
            return result;

        } catch (Exception e) {
            log.error("分配过程出错", e);
            result.success = false;
            result.message = "分配失败: " + e.getMessage();
            throw new RuntimeException(result.message, e);
        }
    }

    /**
     * 生成详细统计信息
     */
    private Map<String, Object> generateStatistics(Long sessionId, List<Student> students) {
        Map<String, Object> stats = new HashMap<>();

        // 学员类型统计
        long monkCount = students.stream()
                .filter(s -> "法师".equals(s.getSpecialNotes()))
                .count();
        long oldStudentCount = students.stream()
                .filter(s -> s.getStudyTimes() != null && s.getStudyTimes() > 0)
                .filter(s -> !"法师".equals(s.getSpecialNotes()))
                .count();
        long newStudentCount = students.stream()
                .filter(s -> s.getStudyTimes() != null && s.getStudyTimes() == 0)
                .filter(s -> !"法师".equals(s.getSpecialNotes()))
                .count();

        stats.put("monkCount", monkCount);
        stats.put("oldStudentCount", oldStudentCount);
        stats.put("newStudentCount", newStudentCount);

        // 性别统计
        long maleCount = students.stream()
                .filter(s -> "M".equals(s.getGender()))
                .count();
        long femaleCount = students.stream()
                .filter(s -> "F".equals(s.getGender()))
                .count();

        stats.put("maleCount", maleCount);
        stats.put("femaleCount", femaleCount);

        // 同伴组统计
        long companionGroupCount = students.stream()
                .filter(s -> s.getFellowGroupId() != null)
                .map(Student::getFellowGroupId)
                .distinct()
                .count();
        long companionStudentCount = students.stream()
                .filter(s -> s.getFellowGroupId() != null)
                .count();

        stats.put("companionGroupCount", companionGroupCount);
        stats.put("companionStudentCount", companionStudentCount);

        // 房间利用统计
        List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
        long usedRoomCount = allocations.stream()
                .map(Allocation::getRoomId)
                .distinct()
                .count();

        stats.put("usedRoomCount", usedRoomCount);

        log.debug("统计信息: {}", stats);
        return stats;
    }

    /**
     * 学员排序：法师 > 旧生 > 新生
     * 同优先级内按修学次数降序
     */
    @Override
    public List<Student> sortStudents(Long sessionId) {
        log.debug("排序学员，期次ID: {}", sessionId);
        List<Student> students = studentMapper.selectSorted(sessionId);
        log.debug("排序后学员数: {}", students.size());
        return students;
    }

    /**
     * 核心分配算法：根据VBA宏逻辑按房间类型优先级分配床位
     * 分配顺序：法师房 → 旧生房 → 新生房 → 老人房1 → 老人房2
     */
    @Override
    @Transactional
    public double allocateBeds(Long sessionId, List<Student> students) {
        log.info("开始分配床位，学员数: {}", students.size());

        // 获取可用房间列表
        List<Room> availableRooms = roomMapper.selectAvailable();
        if (availableRooms.isEmpty()) {
            log.warn("没有可用房间！");
            throw new RuntimeException("没有可用房间");
        }

        // 按性别分组学员
        Map<String, List<Student>> genderGroups = students.stream()
                .collect(Collectors.groupingBy(student ->
                        "M".equals(student.getGender()) ? "男" : "女"));

        List<Allocation> allAllocations = new ArrayList<>();
        Map<Long, Integer> roomOccupancy = new HashMap<>();

        // 为男女分别分配房间
        for (Map.Entry<String, List<Student>> entry : genderGroups.entrySet()) {
            String genderArea = entry.getKey();
            List<Student> genderStudents = entry.getValue();

            log.info("开始分配 {} 学员，共 {} 人", genderArea, genderStudents.size());

            // 使用RoomQueueBuilder构建房间队列（按VBA固定顺序）
            RoomQueueBuilder queueBuilder = new RoomQueueBuilder(availableRooms);
            Queue<Room> roomQueue = queueBuilder.buildQueue(genderArea);

            if (roomQueue.isEmpty()) {
                log.warn("没有可用的 {} 房间", genderArea);
                continue;
            }

            // 使用RoomCursor管理床位分配
            RoomCursor cursor = new RoomCursor(roomQueue);

            // 容量溢出检测
            int availableCapacity = cursor.getRemainingCapacity();
            if (availableCapacity < genderStudents.size()) {
                log.warn("床位容量不足！{} 区域需要 {} 个床位，但只有 {} 个可用床位",
                        genderArea, genderStudents.size(), availableCapacity);
            }

            int genderAllocated = 0;

            // 按顺序分配学员
            for (Student student : genderStudents) {
                if (!cursor.hasNext()) {
                    log.warn("床位不足，无法分配学员: {}", student.getName());
                    break;
                }

                Room room = cursor.nextAvailableRoom();
                if (room == null) {
                    log.warn("无可用房间，无法分配学员: {}", student.getName());
                    break;
                }

                // O(1)计算床位号
                int bedNumber = roomOccupancy.merge(room.getId(), 1, Integer::sum);

                // 创建分配记录
                Allocation allocation = Allocation.builder()
                        .sessionId(sessionId)
                        .studentId(student.getId())
                        .roomId(room.getId())
                        .bedNumber(bedNumber)
                        .allocationType("AUTOMATIC")
                        .allocationReason("按房间类型优先级自动分配")
                        .isTemporary(true)
                        .conflictFlag(false)
                        .build();

                allAllocations.add(allocation);
                genderAllocated++;

                log.debug("已分配: {} ({}) -> 房间ID: {}, 床位: {}",
                        student.getName(), genderArea, room.getId(), bedNumber);
            }

            log.info("{} 学员分配完成，已分配: {} 人", genderArea, genderAllocated);
        }

        // 批量插入分配记录
        if (!allAllocations.isEmpty()) {
            for (Allocation allocation : allAllocations) {
                allocationMapper.insert(allocation);
            }
        }

        // 执行同伴分离（原地修改）
        log.info("开始执行同伴分离...");
        CompanionSplitter splitter = new CompanionSplitter();
        splitter.splitCompanions(allAllocations, students);

        // 批量更新分配记录
        for (Allocation allocation : allAllocations) {
            allocationMapper.update(allocation);
        }

        log.info("同伴分离完成");

        // 防止除以零
        if (students.isEmpty()) {
            return 0.0;
        }

        int totalAllocated = allAllocations.size();
        double allocationScore = (double) totalAllocated / students.size();
        log.info("分配完成: {}/{} ({}%)", totalAllocated, students.size(),
                String.format("%.2f", allocationScore * 100));

        return allocationScore;
    }

    /**
     * 检测分配冲突
     */
    @Override
    public List<AllocationService.AllocationConflict> detectConflicts(Long sessionId) {
        log.debug("检测冲突，期次ID: {}", sessionId);
        List<AllocationService.AllocationConflict> conflicts = new ArrayList<>();

        // 获取所有分配
        List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
        List<Student> students = studentMapper.selectBySessionId(sessionId);
        Map<Long, Student> studentMap = students.stream()
            .collect(Collectors.toMap(Student::getId, s -> s));

        // 检测同伴分离冲突
        for (Student student : students) {
            if (student.getFellowGroupId() != null) {
                List<Student> fellowGroup = studentMapper.selectByFellowGroupId(student.getFellowGroupId());
                // 检查是否有同伴未分配或分配到不同房间
                for (Student fellow : fellowGroup) {
                    if (fellow.getId().equals(student.getId())) continue;

                    Allocation studentAlloc = allocationMapper.selectByStudentId(student.getId());
                    Allocation fellowAlloc = allocationMapper.selectByStudentId(fellow.getId());

                    if (studentAlloc != null && fellowAlloc != null) {
                        // Allocation 现在直接包含 roomId，不需要查询 Bed 表
                        if (!studentAlloc.getRoomId().equals(fellowAlloc.getRoomId())) {
                            AllocationService.AllocationConflict conflict = new AllocationService.AllocationConflict();
                            conflict.studentId = student.getId();
                            conflict.studentName = student.getName();
                            conflict.conflictType = "SEPARATED";
                            conflict.conflictReason = "同伴分离：" + fellow.getName() + "分配到不同房间";
                            conflicts.add(conflict);

                            // 更新冲突标记
                            allocationMapper.updateConflictFlag(studentAlloc.getId(), true, conflict.conflictReason);
                        }
                    }
                }
            }
        }

        log.debug("检测到冲突数: {}", conflicts.size());
        return conflicts;
    }

    /**
     * 应用打乱床位算法
     * 将房间内的床位顺序打乱以避免规律性分配
     */
    @Override
    @Transactional
    public void disruptBedOrder(Long roomId) {
        log.debug("床位顺序由 Room.capacity 推导，跳过打乱操作，房间ID: {}", roomId);
    }

    /**
     * 生成禅堂座位分配
     */
    @Override
    @Transactional
    public void generateMeditationSeats(Long sessionId) {
        log.debug("生成禅堂座位，期次ID: {}", sessionId);

        try {
            // 获取禅堂配置
            List<MeditationHallConfig> configs = meditationHallConfigMapper.selectBySessionId(sessionId);

            if (configs.isEmpty()) {
                log.warn("没有禅堂配置，期次ID: {}", sessionId);
                return;
            }

            for (MeditationHallConfig config : configs) {
                // 获取该禅堂所有学员的分配信息
                List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);

                if (allocations.isEmpty()) {
                    log.warn("没有分配信息，禅堂ID: {}", config.getId());
                    continue;
                }

                int row = 0;
                int col = 0;
                int seatNum = 1;

                for (Allocation allocation : allocations) {
                    Student student = studentMapper.selectById(allocation.getStudentId());

                    if (student == null) {
                        log.warn("学员不存在，学员ID: {}", allocation.getStudentId());
                        continue;
                    }

                    // 确定座位类型
                    String seatType = "STUDENT";
                    if ("monk".equals(student.getStudentType())) {
                        seatType = "MONK";
                    } else if ("old_student".equals(student.getStudentType())) {
                        seatType = "STUDENT";
                    }

                    // 创建座位记录
                    MeditationSeat seat = MeditationSeat.builder()
                        .sessionId(sessionId)
                        .centerId(config.getCenterId())
                        .hallConfigId(config.getId())
                        .hallId(config.getId())
                        .seatNumber(config.getSeatPrefix() != null ?
                            config.getSeatPrefix() + seatNum : "S" + seatNum)
                        .studentId(student.getId())
                        .seatType(seatType)
                        .isOldStudent("old_student".equals(student.getStudentType()))
                        .gender(student.getGender())
                        .ageGroup(student.getAgeGroup())
                        .regionCode(config.getRegionCode())
                        .rowIndex(row)
                        .colIndex(col)
                        .status("allocated")
                        .build();

                    meditationSeatMapper.insert(seat);
                    seatNum++;

                    // 更新坐标
                    col++;
                    if (col >= (config.getRegionWidth() != null ? config.getRegionWidth() : 10)) {
                        col = 0;
                        row++;
                    }
                }

                log.info("禅堂座位生成完成，禅堂ID: {}，座位数: {}", config.getId(), seatNum - 1);
            }

        } catch (Exception e) {
            log.error("生成禅堂座位失败，期次ID: {}", sessionId, e);
            throw new RuntimeException("生成禅堂座位失败: " + e.getMessage());
        }
    }

    @Override
    public List<Allocation> getAllocationsBySession(Long sessionId) {
        return allocationMapper.selectBySessionId(sessionId);
    }

    @Override
    public List<AllocationService.AllocationConflict> getConflicts(Long sessionId) {
        return detectConflicts(sessionId);
    }

    @Override
    @Transactional
    public void clearAllocations(Long sessionId) {
        log.info("清除分配，期次ID: {}", sessionId);

        // 删除分配记录（不再需要重置床位状态，状态通过 Allocation 表推导）
        int deletedCount = allocationMapper.deleteBySessionId(sessionId);

        // 删除禅修座位记录
        meditationSeatMapper.deleteBySessionId(sessionId);

        log.info("清除分配完成，删除 {} 条分配记录", deletedCount);
    }

    @Override
    @Transactional
    public void confirmAllocations(Long sessionId) {
        log.info("确认分配，期次ID: {}", sessionId);
        List<Allocation> allocations = allocationMapper.selectTemporaryBySessionId(sessionId);
        for (Allocation allocation : allocations) {
            allocation.setIsTemporary(false);
            allocationMapper.update(allocation);
        }
    }

    @Override
    @Transactional
    public void rollbackAllocations(Long sessionId) {
        log.warn("回滚分配，期次ID: {}", sessionId);
        clearAllocations(sessionId);
    }

    @Override
    @Transactional
    public Long createAllocation(Allocation allocation) {
        log.info("创建分配，学员ID: {}，房间ID: {}，床位号: {}",
            allocation.getStudentId(), allocation.getRoomId(), allocation.getBedNumber());

        // 设置默认值
        if (allocation.getAllocationType() == null) {
            allocation.setAllocationType("MANUAL");
        }
        if (allocation.getAllocationReason() == null) {
            allocation.setAllocationReason("手动分配");
        }
        if (allocation.getIsTemporary() == null) {
            allocation.setIsTemporary(false);
        }
        if (allocation.getConflictFlag() == null) {
            allocation.setConflictFlag(false);
        }

        // 检查学员是否已分配
        Allocation existing = allocationMapper.selectByStudentId(allocation.getStudentId());
        if (existing != null) {
            log.warn("学员已分配，学员ID: {}", allocation.getStudentId());
            throw new RuntimeException("学员已分配");
        }

        // 创建分配记录（不再需要更新床位状态）
        allocationMapper.insert(allocation);

        log.info("分配创建成功，ID: {}", allocation.getId());
        return allocation.getId();
    }

    @Override
    @Transactional
    public void updateAllocation(Long id, Allocation allocation) {
        log.info("更新分配，ID: {}", id);

        Allocation existing = allocationMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("分配不存在");
        }

        // 更新分配记录（不再需要更新床位状态，状态通过 Allocation 表推导）
        allocation.setId(id);
        allocationMapper.update(allocation);

        log.info("分配更新成功，ID: {}", id);
    }

    @Override
    @Transactional
    public void deleteAllocation(Long id) {
        log.info("删除分配，ID: {}", id);

        Allocation existing = allocationMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("分配不存在");
        }

        // 删除分配记录（不再需要更新床位状态，状态通过 Allocation 表推导）
        allocationMapper.delete(id);

        log.info("分配删除成功，ID: {}", id);
    }

    @Override
    public Allocation getAllocationByStudentId(Long studentId) {
        return allocationMapper.selectByStudentId(studentId);
    }

    @Override
    @Transactional
    public void swapAllocations(Long allocationId1, Long allocationId2) {
        log.info("交换分配，ID1: {}, ID2: {}", allocationId1, allocationId2);

        // 获取两个分配记录
        Allocation allocation1 = allocationMapper.selectById(allocationId1);
        Allocation allocation2 = allocationMapper.selectById(allocationId2);

        if (allocation1 == null) {
            throw new RuntimeException("分配1不存在，ID: " + allocationId1);
        }
        if (allocation2 == null) {
            throw new RuntimeException("分配2不存在，ID: " + allocationId2);
        }

        // 获取学员信息进行验证
        Student student1 = studentMapper.selectById(allocation1.getStudentId());
        Student student2 = studentMapper.selectById(allocation2.getStudentId());

        if (student1 == null || student2 == null) {
            throw new RuntimeException("学员不存在");
        }

        // 获取两个房间（Allocation 直接包含 roomId）
        Room room1 = roomMapper.selectById(allocation1.getRoomId());
        Room room2 = roomMapper.selectById(allocation2.getRoomId());

        if (room1 == null || room2 == null) {
            throw new RuntimeException("房间不存在");
        }

        // 验证性别匹配性
        if (room1 != null && "男".equals(room1.getGenderArea()) && "F".equals(student2.getGender())) {
            throw new RuntimeException("女生不能分配到男生房间");
        }
        if (room1 != null && "女".equals(room1.getGenderArea()) && "M".equals(student2.getGender())) {
            throw new RuntimeException("男生不能分配到女生房间");
        }
        if (room2 != null && "男".equals(room2.getGenderArea()) && "F".equals(student1.getGender())) {
            throw new RuntimeException("女生不能分配到男生房间");
        }
        if (room2 != null && "女".equals(room2.getGenderArea()) && "M".equals(student1.getGender())) {
            throw new RuntimeException("男生不能分配到女生房间");
        }

        // 交换房间和床位
        Long tempRoomId = allocation1.getRoomId();
        Integer tempBedNumber = allocation1.getBedNumber();
        allocation1.setRoomId(allocation2.getRoomId());
        allocation1.setBedNumber(allocation2.getBedNumber());
        allocation2.setRoomId(tempRoomId);
        allocation2.setBedNumber(tempBedNumber);

        // 更新分配记录
        allocationMapper.update(allocation1);
        allocationMapper.update(allocation2);

        log.info("分配交换成功，学员1: {}，学员2: {}", student1.getName(), student2.getName());
    }
}

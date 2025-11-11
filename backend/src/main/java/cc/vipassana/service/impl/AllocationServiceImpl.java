package cc.vipassana.service.impl;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.AllocationService;
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

            // 5. 生成禅堂座位
            generateMeditationSeats(sessionId);

            // 6. 更新状态
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

    // 辅助类：表示可用床位 (roomId + bedNumber)
    @lombok.Value
    private static class AvailableBed {
        Long roomId;
        Integer bedNumber;
    }

    /**
     * 核心分配算法：根据优先级和同伴关系分配床位
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

        // 按性别区分创建床位队列：男性房间和女性房间
        Queue<AvailableBed> maleBedsQueue = new LinkedList<>();
        Queue<AvailableBed> femaleBedsQueue = new LinkedList<>();

        // 查询当前会期已分配的床位
        List<Allocation> existingAllocations = allocationMapper.selectBySessionId(sessionId);
        Set<String> occupiedBeds = existingAllocations.stream()
            .map(a -> a.getRoomId() + "-" + a.getBedNumber())
            .collect(Collectors.toSet());

        for (Room room : availableRooms) {
            // 根据房间容量生成可用床位
            List<AvailableBed> availableBeds = new ArrayList<>();
            for (int i = 1; i <= room.getCapacity(); i++) {
                String bedKey = room.getId() + "-" + i;
                if (!occupiedBeds.contains(bedKey)) {
                    availableBeds.add(new AvailableBed(room.getId(), i));
                }
            }

            // 根据房间的性别区域分类床位（支持"男"/"男众"和"女"/"女众"）
            if (room.getGenderArea() != null && room.getGenderArea().contains("男")) {
                maleBedsQueue.addAll(availableBeds);
                log.debug("房间 {} ({}): 添加 {} 张床位", room.getRoomNumber(), room.getGenderArea(), availableBeds.size());
            } else if (room.getGenderArea() != null && room.getGenderArea().contains("女")) {
                femaleBedsQueue.addAll(availableBeds);
                log.debug("房间 {} ({}): 添加 {} 张床位", room.getRoomNumber(), room.getGenderArea(), availableBeds.size());
            }
        }

        log.info("可用床位: 男性房间 {} 张, 女性房间 {} 张", maleBedsQueue.size(), femaleBedsQueue.size());

        int allocatedCount = 0;

        // 分配学员到床位 - 按性别分离
        for (Student student : students) {
            Queue<AvailableBed> studentBedQueue = "M".equals(student.getGender()) ? maleBedsQueue : femaleBedsQueue;

            if (studentBedQueue.isEmpty()) {
                log.warn("无可用床位 [{}]: 无法分配学员: {}", "M".equals(student.getGender()) ? "男" : "女", student.getName());
                continue;
            }

            AvailableBed bed = studentBedQueue.poll();
            try {
                // 创建分配记录
                Allocation allocation = Allocation.builder()
                    .sessionId(sessionId)
                    .studentId(student.getId())
                    .roomId(bed.getRoomId())
                    .bedNumber(bed.getBedNumber())
                    .allocationType("AUTOMATIC")
                    .allocationReason("自动分配")
                    .isTemporary(true)
                    .conflictFlag(false)
                    .build();

                allocationMapper.insert(allocation);
                allocatedCount++;

                log.debug("已分配: {} ({}) -> 房间ID: {}, 床位: {}", student.getName(),
                    "M".equals(student.getGender()) ? "男" : "女", bed.getRoomId(), bed.getBedNumber());

            } catch (Exception e) {
                log.error("分配失败: {} -> 房间ID: {}, 床位: {}", student.getName(), bed.getRoomId(), bed.getBedNumber(), e);
                studentBedQueue.offer(bed); // 返还床位到对应的性别队列
            }
        }

        // 防止除以零
        if (students.isEmpty()) {
            return 0.0;
        }

        double allocationScore = (double) allocatedCount / students.size();
        log.info("分配完成: {}/{} ({}%)", allocatedCount, students.size(),
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

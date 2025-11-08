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
    private final BedMapper bedMapper;
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
        Queue<Bed> maleBedsQueue = new LinkedList<>();
        Queue<Bed> femaleBedsQueue = new LinkedList<>();

        for (Room room : availableRooms) {
            List<Bed> beds = bedMapper.selectAvailableByRoomId(room.getId());

            // 根据房间的性别区域分类床位（支持"男"/"男众"和"女"/"女众"）
            if (room.getGenderArea() != null && room.getGenderArea().contains("男")) {
                maleBedsQueue.addAll(beds);
                log.debug("房间 {} ({}): 添加 {} 张床位", room.getRoomNumber(), room.getGenderArea(), beds.size());
            } else if (room.getGenderArea() != null && room.getGenderArea().contains("女")) {
                femaleBedsQueue.addAll(beds);
                log.debug("房间 {} ({}): 添加 {} 张床位", room.getRoomNumber(), room.getGenderArea(), beds.size());
            }
        }

        log.info("可用床位: 男性房间 {} 张, 女性房间 {} 张", maleBedsQueue.size(), femaleBedsQueue.size());

        int allocatedCount = 0;

        // 分配学员到床位 - 按性别分离
        for (Student student : students) {
            Queue<Bed> studentBedQueue = "M".equals(student.getGender()) ? maleBedsQueue : femaleBedsQueue;

            if (studentBedQueue.isEmpty()) {
                log.warn("无可用床位 [{}]: 无法分配学员: {}", "M".equals(student.getGender()) ? "男" : "女", student.getName());
                continue;
            }

            Bed bed = studentBedQueue.poll();
            try {
                // 创建分配记录
                Allocation allocation = Allocation.builder()
                    .sessionId(sessionId)
                    .studentId(student.getId())
                    .bedId(bed.getId())
                    .allocationType("AUTOMATIC")
                    .allocationReason("自动分配")
                    .isTemporary(true)
                    .conflictFlag(false)
                    .build();

                allocationMapper.insert(allocation);
                bedMapper.updateStatus(bed.getId(), "OCCUPIED");
                allocatedCount++;

                log.debug("已分配: {} ({}) -> 房间床位ID: {}", student.getName(),
                    "M".equals(student.getGender()) ? "男" : "女", bed.getId());

            } catch (Exception e) {
                log.error("分配失败: {} -> 床位ID: {}", student.getName(), bed.getId(), e);
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
                        Bed studentBed = bedMapper.selectById(studentAlloc.getBedId());
                        Bed fellowBed = bedMapper.selectById(fellowAlloc.getBedId());

                        if (studentBed != null && fellowBed != null &&
                            !studentBed.getRoomId().equals(fellowBed.getRoomId())) {
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
        log.debug("应用打乱床位算法，房间ID: {}", roomId);
        List<Bed> beds = bedMapper.selectByRoomId(roomId);

        if (beds.isEmpty()) {
            log.warn("房间内没有床位，房间ID: {}", roomId);
            return;
        }

        // Fisher-Yates 洗牌算法
        Random random = new Random();
        for (int i = beds.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            Bed temp = beds.get(i);
            beds.set(i, beds.get(j));
            beds.set(j, temp);
        }

        log.debug("床位打乱完成，房间ID: {}，共 {} 张床", roomId, beds.size());
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
        allocationMapper.deleteBySessionId(sessionId);
        meditationSeatMapper.deleteBySessionId(sessionId);
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
        log.info("创建分配，学员ID: {}，床位ID: {}", allocation.getStudentId(), allocation.getBedId());

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

        // 更新床位状态
        allocationMapper.insert(allocation);
        if (allocation.getBedId() != null) {
            bedMapper.updateStatus(allocation.getBedId(), "OCCUPIED");
        }

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

        // 如果修改了床位，需要更新旧床位状态为可用
        if (!existing.getBedId().equals(allocation.getBedId())) {
            bedMapper.updateStatus(existing.getBedId(), "AVAILABLE");
            bedMapper.updateStatus(allocation.getBedId(), "OCCUPIED");
        }

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

        // 恢复床位为可用
        if (existing.getBedId() != null) {
            bedMapper.updateStatus(existing.getBedId(), "AVAILABLE");
        }

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

        // 获取学员和床位信息进行验证
        Student student1 = studentMapper.selectById(allocation1.getStudentId());
        Student student2 = studentMapper.selectById(allocation2.getStudentId());
        Bed bed1 = bedMapper.selectById(allocation1.getBedId());
        Bed bed2 = bedMapper.selectById(allocation2.getBedId());

        if (student1 == null || student2 == null) {
            throw new RuntimeException("学员不存在");
        }
        if (bed1 == null || bed2 == null) {
            throw new RuntimeException("床位不存在");
        }

        // 获取两个床位所在的房间
        Room room1 = roomMapper.selectById(bed1.getRoomId());
        Room room2 = roomMapper.selectById(bed2.getRoomId());

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

        // 交换床位
        Long tempBedId = allocation1.getBedId();
        allocation1.setBedId(allocation2.getBedId());
        allocation2.setBedId(tempBedId);

        // 更新分配记录
        allocationMapper.update(allocation1);
        allocationMapper.update(allocation2);

        log.info("分配交换成功，学员1: {}，学员2: {}", student1.getName(), student2.getName());
    }
}

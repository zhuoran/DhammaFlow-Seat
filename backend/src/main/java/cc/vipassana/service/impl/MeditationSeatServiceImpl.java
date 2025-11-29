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

            // 分配算法应覆盖所有学员，即便未做房间分配；房间分配仅用于 bedCode 绑定
            List<Student> students = studentMapper.selectBySessionId(sessionId);

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

            // 处理同伴标记（需要在座位写入后，利用生成的ID更新）
            processCompanionSeats(generatedSeats, students);

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

    private String resolveBedCode(Long studentId, Long sessionId) {
        Allocation allocation = allocationMapper.selectByStudentId(studentId);
        if (allocation == null) {
            return null;
        }
        if (allocation.getSessionId() != null && sessionId != null &&
                !allocation.getSessionId().equals(sessionId)) {
            return null;
        }
        if (allocation.getRoomId() == null || allocation.getBedNumber() == null) {
            return null;
        }
        Room room = roomMapper.selectById(allocation.getRoomId());
        String roomNumber = room != null ? room.getRoomNumber() : String.valueOf(allocation.getRoomId());
        return roomNumber + "-" + allocation.getBedNumber();
    }

    @Override
    public List<MeditationSeat> getSeats(Long sessionId) {
        List<MeditationSeat> seats = meditationSeatMapper.selectBySessionId(sessionId);
        enrichCompanionNames(sessionId, seats);
        return seats;
    }

    @Override
    public List<MeditationSeat> getSeatsByRegion(Long sessionId, String regionCode) {
        List<MeditationSeat> allSeats = meditationSeatMapper.selectBySessionId(sessionId);
        enrichCompanionNames(sessionId, allSeats);
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

        if (seat1.getSessionId() != null && seat2.getSessionId() != null &&
                !seat1.getSessionId().equals(seat2.getSessionId())) {
            throw new RuntimeException("不同会期的座位无法交换");
        }

        if ("reserved".equalsIgnoreCase(seat1.getStatus()) || "reserved".equalsIgnoreCase(seat2.getStatus())) {
            throw new RuntimeException("保留座位不可交换");
        }

        if (seat1.getGender() != null && seat2.getGender() != null &&
                !seat1.getGender().equalsIgnoreCase(seat2.getGender())) {
            throw new RuntimeException("性别不匹配，无法交换");
        }

        Long studentId1 = seat1.getStudentId();
        Long studentId2 = seat2.getStudentId();

        if (studentId1 == null && studentId2 == null) {
            throw new RuntimeException("两个座位都为空，无需交换");
        }

        // 交换学员
        seat1.setStudentId(studentId2);
        seat2.setStudentId(studentId1);
        seat1.setBedCode(resolveBedCode(studentId2, seat1.getSessionId()));
        seat2.setBedCode(resolveBedCode(studentId1, seat2.getSessionId()));
        seat1.setStatus(studentId2 == null ? "available" : "allocated");
        seat2.setStatus(studentId1 == null ? "available" : "allocated");
        seat1.setUpdatedAt(LocalDateTime.now());
        seat2.setUpdatedAt(LocalDateTime.now());

        meditationSeatMapper.update(seat1);
        meditationSeatMapper.update(seat2);

        // 更新同伴座位关系
        updateCompanionRelations(seat1);
        updateCompanionRelations(seat2);
        recalcCompanionRelations(seat1.getSessionId());

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

        // 新的同伴逻辑依赖 fellow_list 的全量重算，这里不做局部处理
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

            if ("reserved".equalsIgnoreCase(seat.getStatus())) {
                throw new RuntimeException("保留座位不可分配");
            }

            // studentId <=0 视为取消分配
            if (studentId == null || studentId <= 0) {
                seat.setStudentId(null);
                seat.setBedCode(null);
                seat.setStatus("available");
                seat.setIsWithCompanion(false);
                seat.setCompanionSeatId(null);
                seat.setUpdatedAt(LocalDateTime.now());
                meditationSeatMapper.update(seat);
                updateCompanionRelations(seat);
                log.info("已取消座位分配，座位 {}", seatId);
                return;
            }

            Student student = studentMapper.selectById(studentId);

            if (student == null) {
                throw new RuntimeException("学员不存在");
            }

            if (seat.getSessionId() != null && student.getSessionId() != null &&
                    !seat.getSessionId().equals(student.getSessionId())) {
                throw new RuntimeException("学员与座位不属于同一会期");
            }

            if (seat.getGender() != null && student.getGender() != null &&
                    !seat.getGender().equalsIgnoreCase(student.getGender())) {
                throw new RuntimeException("性别不匹配，无法分配");
            }

            // 若学员已占用其他座位，先释放
            MeditationSeat existingSeat = meditationSeatMapper.selectByStudentId(studentId);
            if (existingSeat != null && !existingSeat.getId().equals(seatId)) {
                if (existingSeat.getSessionId() != null && seat.getSessionId() != null &&
                        !existingSeat.getSessionId().equals(seat.getSessionId())) {
                    throw new RuntimeException("学员已在其他会期占用座位");
                }
                existingSeat.setStudentId(null);
                existingSeat.setBedCode(null);
                existingSeat.setStatus("available");
                existingSeat.setIsWithCompanion(false);
                existingSeat.setCompanionSeatId(null);
                existingSeat.setUpdatedAt(LocalDateTime.now());
                meditationSeatMapper.update(existingSeat);
                updateCompanionRelations(existingSeat);
            }

            String bedCode = resolveBedCode(studentId, seat.getSessionId());

            seat.setStudentId(studentId);
            seat.setBedCode(bedCode);
            seat.setUpdatedAt(LocalDateTime.now());
            seat.setStatus("allocated");

            meditationSeatMapper.update(seat);
            updateCompanionRelations(seat);

            recalcCompanionRelations(seat.getSessionId());

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
            CompanionContext ctx = buildCompanionContext(students, seats);

            // 清空旧标记
            for (MeditationSeat seat : seats) {
                seat.setIsWithCompanion(false);
                seat.setCompanionSeatId(null);
            }

            // 标记同伴关系：有同伴就打标，相邻则指向对方座位
            for (MeditationSeat seat : seats) {
                Long studentId = seat.getStudentId();
                if (studentId == null) {
                    continue;
                }
                
                // 获取匹配到的同伴ID
                Set<Long> companions = ctx.fellowMap().getOrDefault(studentId, Collections.emptySet());
                // 获取未匹配的同伴姓名
                Set<String> unmatchedNames = ctx.unmatchedCompanionNames().getOrDefault(studentId, Collections.emptySet());
                
                if (companions.isEmpty() && unmatchedNames.isEmpty()) {
                    continue;
                }
                
                seat.setIsWithCompanion(true);

                // 同伴姓名优先取匹配到的学生姓名，否则取未匹配的原始姓名
                for (Long companionId : companions) {
                    Student companionStudent = ctx.studentMap().get(companionId);
                    if (companionStudent != null && StringUtils.hasText(companionStudent.getName())) {
                        seat.setCompanionName(companionStudent.getName());
                        break;
                    }
                }
                if (!unmatchedNames.isEmpty() && !StringUtils.hasText(seat.getCompanionName())) {
                    seat.setCompanionName(unmatchedNames.iterator().next());
                }

                // 尝试优先相邻的同伴座位，否则取任意有座位的同伴
                MeditationSeat anyCompanionSeat = null;
                for (Long companionId : companions) {
                    MeditationSeat companionSeat = ctx.studentSeatMap().get(companionId);
                    if (companionSeat == null) {
                        continue;
                    }
                    if (isAdjacentSeats(seat, companionSeat)) {
                        seat.setCompanionSeatId(companionSeat.getId());
                        break;
                    }
                    if (anyCompanionSeat == null) {
                        anyCompanionSeat = companionSeat;
                    }
                }
                if (seat.getCompanionSeatId() == null && anyCompanionSeat != null) {
                    seat.setCompanionSeatId(anyCompanionSeat.getId());
                }
                seat.setUpdatedAt(LocalDateTime.now());
                meditationSeatMapper.update(seat);
            }

            log.info("同伴标记完成，涉及 {} 名学员（匹配: {}, 未匹配: {}）", 
                    ctx.fellowMap().size(), 
                    ctx.fellowMap().size(),
                    ctx.unmatchedCompanionNames().size());

        } catch (Exception e) {
            log.error("处理同伴座位标记失败", e);
            // 不抛出异常，允许座位生成继续
        }
    }

    private CompanionContext buildCompanionContext(List<Student> students, List<MeditationSeat> seats) {
        Map<String, Long> nameIndex = new HashMap<>();
        Map<Long, Student> studentMap = new HashMap<>();
        for (Student s : students) {
            if (s.getName() != null) {
                nameIndex.put(s.getName().trim(), s.getId());
            }
            studentMap.put(s.getId(), s);
        }

        Map<Long, Set<Long>> fellowMap = new HashMap<>();
        Map<Long, Set<String>> unmatchedCompanionNames = new HashMap<>();
        int matchedTokens = 0;
        int unmatchedTokens = 0;
        List<String> unmatchedSamples = new ArrayList<>();
        // 预备一个按长度排序的姓名列表，用于模糊拆分连续姓名
        List<String> sortedNames = new ArrayList<>(nameIndex.keySet());
        sortedNames.sort((a, b) -> Integer.compare(b.length(), a.length()));

        for (Student s : students) {
            if (!StringUtils.hasText(s.getFellowList())) {
                continue;
            }
            // 去掉关系段，仅保留 '/' 之前的部分
            String base = s.getFellowList();
            int slashIdx = base.indexOf('/');
            if (slashIdx >= 0) {
                base = base.substring(0, slashIdx);
            }

            // 按常见分隔符拆分
            String[] tokens = base.split("[,;；、，|/\\s]+");
            Set<String> candidateNames = new LinkedHashSet<>();
            for (String raw : tokens) {
                String name = raw
                        .replace("（", "(")
                        .replace("）", ")")
                        .replace("：", ":")
                        .trim();
                if (name.isEmpty()) {
                    continue;
                }
                candidateNames.add(name);
            }

            // 对每个 token 尝试直接匹配，否则在其中查找已知姓名子串
            Set<Long> companionsForStudent = fellowMap.computeIfAbsent(s.getId(), k -> new LinkedHashSet<>());
            Set<String> unmatchedForStudent = unmatchedCompanionNames.computeIfAbsent(s.getId(), k -> new LinkedHashSet<>());
            
            for (String token : candidateNames) {
                Long cid = nameIndex.get(token);
                if (cid != null && !cid.equals(s.getId())) {
                    companionsForStudent.add(cid);
                    matchedTokens++;
                    continue;
                }
                boolean matchedSub = false;
                for (String known : sortedNames) {
                    if (token.contains(known)) {
                        Long subCid = nameIndex.get(known);
                        if (subCid != null && !subCid.equals(s.getId())) {
                            companionsForStudent.add(subCid);
                            matchedTokens++;
                            matchedSub = true;
                        }
                    }
                }
                if (!matchedSub) {
                    // 保存未匹配的同伴姓名
                    unmatchedForStudent.add(token);
                    unmatchedTokens++;
                    if (unmatchedSamples.size() < 5) {
                        unmatchedSamples.add(token);
                    }
                }
            }

            // 双向补充（仅针对匹配到的同伴）
            for (Long cid : companionsForStudent) {
                fellowMap.computeIfAbsent(cid, k -> new LinkedHashSet<>()).add(s.getId());
            }
        }

        Map<Long, MeditationSeat> studentSeatMap = new HashMap<>();
        for (MeditationSeat seat : seats) {
            if (seat.getStudentId() != null) {
                studentSeatMap.put(seat.getStudentId(), seat);
            }
        }
        // 准备部分映射示例输出，便于排查
        List<String> mappingSamples = new ArrayList<>();
        for (Map.Entry<Long, Set<Long>> entry : fellowMap.entrySet()) {
            if (mappingSamples.size() >= 5) {
                break;
            }
            Student s = studentMap.get(entry.getKey());
            String selfName = s != null ? s.getName() : String.valueOf(entry.getKey());
            List<String> companionNames = entry.getValue().stream()
                    .map(id -> {
                        Student cs = studentMap.get(id);
                        return cs != null ? cs.getName() : String.valueOf(id);
                    })
                    .toList();
            mappingSamples.add(selfName + " -> " + companionNames);
        }
        
        // 准备未匹配同伴的示例输出
        List<String> unmatchedMappingSamples = new ArrayList<>();
        for (Map.Entry<Long, Set<String>> entry : unmatchedCompanionNames.entrySet()) {
            if (unmatchedMappingSamples.size() >= 5) {
                break;
            }
            Student s = studentMap.get(entry.getKey());
            String selfName = s != null ? s.getName() : String.valueOf(entry.getKey());
            unmatchedMappingSamples.add(selfName + " -> " + entry.getValue());
        }

        log.info("同伴解析: matched={}, pairs={}, students={}, unmatched={}, unmatchedSamples={}, mapSamples={}, unmatchedMapSamples={}",
                matchedTokens, fellowMap.size(), students.size(), unmatchedTokens, unmatchedSamples, mappingSamples, unmatchedMappingSamples);
        return new CompanionContext(fellowMap, studentSeatMap, studentMap, unmatchedCompanionNames);
    }

private record CompanionContext(Map<Long, Set<Long>> fellowMap, 
                                    Map<Long, MeditationSeat> studentSeatMap,
                                    Map<Long, Student> studentMap,
                                    Map<Long, Set<String>> unmatchedCompanionNames) {}

    /**
     * 查询座位列表后，为返回结果补充同伴姓名（避免非持久化字段丢失）。
     */
    private void enrichCompanionNames(Long sessionId, List<MeditationSeat> seats) {
        if (seats == null || seats.isEmpty() || sessionId == null) {
            return;
        }
        List<Student> students = studentMapper.selectBySessionId(sessionId);
        CompanionContext ctx = buildCompanionContext(students, seats);
        Map<Long, MeditationSeat> seatById = seats.stream()
                .collect(Collectors.toMap(MeditationSeat::getId, s -> s, (a, b) -> a));

        for (MeditationSeat seat : seats) {
            if (!Boolean.TRUE.equals(seat.getIsWithCompanion())) {
                continue;
            }
            // 1) 如果有同伴座位ID，优先用座位对应的学生姓名
            if (seat.getCompanionSeatId() != null) {
                MeditationSeat cs = seatById.get(seat.getCompanionSeatId());
                if (cs != null && cs.getStudentId() != null) {
                    Student companionStudent = ctx.studentMap().get(cs.getStudentId());
                    if (companionStudent != null && StringUtils.hasText(companionStudent.getName())) {
                        seat.setCompanionName(companionStudent.getName());
                        continue;
                    }
                }
            }
            // 2) 如果有匹配到的同伴学生，但没有座位ID，填充姓名
            if (seat.getStudentId() != null) {
                Set<Long> companions = ctx.fellowMap().getOrDefault(seat.getStudentId(), Collections.emptySet());
                for (Long cid : companions) {
                    Student cst = ctx.studentMap().get(cid);
                    if (cst != null && StringUtils.hasText(cst.getName())) {
                        seat.setCompanionName(cst.getName());
                        break;
                    }
                }
                if (StringUtils.hasText(seat.getCompanionName())) {
                    continue;
                }
                // 3) 使用未匹配的原始姓名填充
                Set<String> unmatched = ctx.unmatchedCompanionNames().getOrDefault(seat.getStudentId(), Collections.emptySet());
                if (!unmatched.isEmpty()) {
                    seat.setCompanionName(unmatched.iterator().next());
                }
            }
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

    /**
     * 全量重算会期内的同伴标记，避免局部操作遗漏。
     */
    private void recalcCompanionRelations(Long sessionId) {
        if (sessionId == null) {
            return;
        }
        List<MeditationSeat> seats = meditationSeatMapper.selectBySessionId(sessionId);
        if (seats.isEmpty()) {
            return;
        }
        List<Long> studentIds = seats.stream()
                .map(MeditationSeat::getStudentId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        List<Student> students = studentIds.isEmpty()
                ? Collections.emptyList()
                : studentMapper.selectByIds(studentIds);
        processCompanionSeats(seats, students);
    }
}

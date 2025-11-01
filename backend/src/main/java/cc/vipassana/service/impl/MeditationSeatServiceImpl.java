package cc.vipassana.service.impl;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.MeditationSeatService;
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

            // 2. 获取该期次所有学员的分配信息
            List<Allocation> allocations = allocationMapper.selectBySessionId(sessionId);
            List<Student> students = new ArrayList<>();

            for (Allocation allocation : allocations) {
                Student student = studentMapper.selectById(allocation.getStudentId());
                if (student != null) {
                    students.add(student);
                }
            }

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

    private List<MeditationSeat> generateRegionSeats(Long sessionId, MeditationHallConfig config,
                                                     List<Student> students) {
        List<MeditationSeat> seats = new ArrayList<>();

        int row = 0;
        int col = 0;
        int seatNum = 1;
        int regionWidth = config.getRegionWidth() != null ? config.getRegionWidth() : 10;

        for (Student student : students) {
            String seatType = "STUDENT";
            if ("monk".equals(student.getStudentType())) {
                seatType = "MONK";
            }

            String seatNumber = generateSeatNumber(config, seatNum);

            MeditationSeat seat = MeditationSeat.builder()
                    .sessionId(sessionId)
                    .centerId(config.getCenterId())
                    .hallConfigId(config.getId())
                    .hallId(config.getId())
                    .seatNumber(seatNumber)
                    .studentId(student.getId())
                    .seatType(seatType)
                    .isOldStudent("old_student".equals(student.getStudentType()))
                    .gender(student.getGender())
                    .ageGroup(student.getAgeGroup())
                    .regionCode(config.getRegionCode())
                    .rowIndex(row)
                    .colIndex(col)
                    .status("allocated")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            meditationSeatMapper.insert(seat);
            seats.add(seat);
            seatNum++;

            col++;
            if (col >= regionWidth) {
                col = 0;
                row++;
            }
        }

        log.debug("禅堂区域 {} 座位生成完成，共 {} 个座位", config.getRegionCode(), seats.size());
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
}

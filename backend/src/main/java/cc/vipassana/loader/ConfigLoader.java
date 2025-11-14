package cc.vipassana.loader;

import cc.vipassana.dto.config.CenterConfigDto;
import cc.vipassana.dto.config.MeditationHallConfigDto;
import cc.vipassana.dto.config.RoomConfigDto;
import cc.vipassana.entity.Center;
import cc.vipassana.entity.Room;
import cc.vipassana.entity.MeditationHallConfig;
import cc.vipassana.entity.Session;
import cc.vipassana.mapper.CenterMapper;
import cc.vipassana.mapper.RoomMapper;
import cc.vipassana.mapper.MeditationHallConfigMapper;
import cc.vipassana.mapper.SessionMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 配置加载器
 * 系统启动时加载 YAML 配置文件，初始化中心、房间、禅堂等基础数据
 */
@Slf4j
@Component
public class ConfigLoader implements CommandLineRunner {

    @Autowired
    private CenterMapper centerMapper;

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private MeditationHallConfigMapper meditationHallConfigMapper;

    @Autowired
    private cc.vipassana.mapper.SessionMapper sessionMapper;

    @Value("${config.path:config}")
    private String configPath;

    /**
     * 应用启动时执行
     */
    @Override
    public void run(String... args) throws Exception {
        log.info("=============== 开始加载配置文件 ===============");
        try {
            loadCentersConfig();
            loadSessionsConfig();
            log.info("=============== 配置文件加载完成 ===============");
        } catch (Exception e) {
            log.error("配置文件加载失败", e);
            throw e;
        }
    }

    /**
     * 加载禅修中心配置
     */
    private void loadCentersConfig() throws IOException {
        String centersFile = configPath + "/centers.yaml";
        log.info("加载中心配置: {}", centersFile);

        Resource resource = new ClassPathResource(centersFile);
        if (!resource.exists()) {
            log.warn("中心配置文件不存在: {}", centersFile);
            return;
        }

        try (InputStream inputStream = resource.getInputStream()) {
            Yaml yaml = new Yaml();
            Map<String, Object> data = yaml.load(inputStream);
            List<Map<String, Object>> centers = (List<Map<String, Object>>) data.get("centers");

            if (centers == null || centers.isEmpty()) {
                log.warn("中心列表为空");
                return;
            }

            for (Map<String, Object> centerData : centers) {
                CenterConfigDto centerConfig = parseCenter(centerData);
                loadCenter(centerConfig);
            }
        }
    }

    /**
     * 加载单个中心及其房间和禅堂配置
     */
    private void loadCenter(CenterConfigDto centerConfig) throws IOException {
        // 1. 保存或更新中心
        Center center = new Center();
        center.setId(centerConfig.getId().longValue());
        center.setCenterName(centerConfig.getName());
        center.setAddress(centerConfig.getAddress());
        center.setContactPerson(centerConfig.getContactPerson());
        center.setContactPhone(centerConfig.getContactPhone());
        center.setCenterDescription(centerConfig.getDescription());
        center.setStatus(centerConfig.getStatus());
        center.setCreatedAt(LocalDateTime.now());
        center.setUpdatedAt(LocalDateTime.now());

        // 检查中心是否存在
        Center existingCenter = centerMapper.selectById(center.getId());
        if (existingCenter == null) {
            centerMapper.insert(center);
            log.info("新增中心: {} ({})", center.getCenterName(), center.getId());
        } else {
            centerMapper.update(center);
            log.info("更新中心: {} ({})", center.getCenterName(), center.getId());
        }

        // 2. 加载房间配置
        if (centerConfig.getRoomsFile() != null) {
            loadRoomsConfig(center.getId(), centerConfig.getRoomsFile());
        }

        // 3. 加载禅堂配置
        if (centerConfig.getHallsFile() != null) {
            loadHallsConfig(center.getId(), centerConfig.getHallsFile());
        }
    }

    /**
     * 加载房间配置
     */
    private void loadRoomsConfig(Long centerId, String roomsFile) throws IOException {
        String filePath = configPath + "/" + roomsFile;
        log.info("加载房间配置: {} (中心: {})", filePath, centerId);

        Resource resource = new ClassPathResource(filePath);
        if (!resource.exists()) {
            log.warn("房间配置文件不存在: {}", filePath);
            return;
        }

        try (InputStream inputStream = resource.getInputStream()) {
            Yaml yaml = new Yaml();
            Map<String, Object> data = yaml.load(inputStream);
            List<Map<String, Object>> rooms = (List<Map<String, Object>>) data.get("rooms");

            if (rooms == null || rooms.isEmpty()) {
                log.warn("房间列表为空: {}", filePath);
                return;
            }

            // 清除该中心的旧房间记录（可选）
            // roomMapper.deleteByCenter Id(centerId);

            int successCount = 0;
            for (Map<String, Object> roomData : rooms) {
                try {
                    RoomConfigDto.RoomItemDto roomItem = parseRoom(roomData);
                    loadRoom(centerId, roomItem);
                    successCount++;
                } catch (Exception e) {
                    log.error("加载房间失败: {}", roomData, e);
                }
            }
            log.info("房间加载完成: 成功 {} 条", successCount);
        }
    }

    /**
     * 加载禅堂配置
     */
    private void loadHallsConfig(Long centerId, String hallsFile) throws IOException {
        String filePath = configPath + "/" + hallsFile;
        log.info("加载禅堂配置: {} (中心: {})", filePath, centerId);

        Resource resource = new ClassPathResource(filePath);
        if (!resource.exists()) {
            log.warn("禅堂配置文件不存在: {}", filePath);
            return;
        }

        try (InputStream inputStream = resource.getInputStream()) {
            Yaml yaml = new Yaml();
            Map<String, Object> data = yaml.load(inputStream);
            List<Map<String, Object>> halls = (List<Map<String, Object>>) data.get("meditation_halls");

            if (halls == null || halls.isEmpty()) {
                log.warn("禅堂列表为空: {}", filePath);
                return;
            }

            int successCount = 0;
            for (Map<String, Object> hallData : halls) {
                try {
                    MeditationHallConfigDto.HallRegionDto hallRegion = parseHall(hallData);
                    loadHall(centerId, hallRegion);
                    successCount++;
                } catch (Exception e) {
                    log.error("加载禅堂失败: {}", hallData, e);
                }
            }
            log.info("禅堂加载完成: 成功 {} 条", successCount);
        }
    }

    /**
     * 保存房间到数据库
     */
    private void loadRoom(Long centerId, RoomConfigDto.RoomItemDto roomItem) {
        Room room = new Room();
        room.setCenterId(centerId);
        room.setRoomNumber(roomItem.getNumber());
        room.setBuilding(roomItem.getBuilding());
        room.setFloor(roomItem.getFloor());
        room.setCapacity(roomItem.getCapacity());
        room.setRoomType(roomItem.getType());
        room.setStatus(roomItem.getStatus());
        room.setGenderArea(roomItem.getGenderArea());
        room.setNotes(roomItem.getNotes());
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());

        // 检查房间是否存在
        try {
            Room existingRoom = roomMapper.selectByNumber(centerId, room.getRoomNumber());
            if (existingRoom == null) {
                roomMapper.insert(room);
            } else {
                room.setId(existingRoom.getId());
                roomMapper.update(room);
            }
        } catch (Exception e) {
            log.warn("房间 {} 查询失败，将直接插入: {}", room.getRoomNumber(), e.getMessage());
            roomMapper.insert(room);
        }
    }

    /**
     * 保存禅堂配置到数据库
     */
    private void loadHall(Long centerId, MeditationHallConfigDto.HallRegionDto hallRegion) {
        MeditationHallConfig config = new MeditationHallConfig();
        config.setCenterId(centerId);
        config.setRegionCode(hallRegion.getCode());
        config.setRegionName(hallRegion.getName());
        config.setGenderType(hallRegion.getGenderType());
        config.setRegionWidth(hallRegion.getRegionWidth());
        config.setRegionRows(null); // 自动计算
        config.setIsAutoWidth(true);
        config.setIsAutoRows(hallRegion.getAutoRows() != null ? hallRegion.getAutoRows() : true);
        config.setNumberingType(hallRegion.getNumberingType());
        config.setSeatPrefix(hallRegion.getSeatPrefix());
        config.setSupportedGenders("MIXED");
        config.setHallUsage("SINGLE");
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        // 检查禅堂配置是否存在
        MeditationHallConfig existingConfig = meditationHallConfigMapper.selectByRegionCode(centerId, hallRegion.getCode());
        if (existingConfig == null) {
            meditationHallConfigMapper.insert(config);
        } else {
            config.setId(existingConfig.getId());
            meditationHallConfigMapper.update(config);
        }
    }

    /**
     * 解析中心配置
     */
    private CenterConfigDto parseCenter(Map<String, Object> data) {
        return CenterConfigDto.builder()
                .id(((Number) data.get("id")).intValue())
                .name((String) data.get("name"))
                .address((String) data.getOrDefault("address", ""))
                .contactPerson((String) data.getOrDefault("contact_person", ""))
                .contactPhone((String) data.getOrDefault("contact_phone", ""))
                .description((String) data.getOrDefault("description", ""))
                .status((String) data.getOrDefault("status", "OPERATING"))
                .roomsFile((String) data.getOrDefault("rooms_file", null))
                .hallsFile((String) data.getOrDefault("halls_file", null))
                .build();
    }

    /**
     * 解析房间配置
     */
    private RoomConfigDto.RoomItemDto parseRoom(Map<String, Object> data) {
        return RoomConfigDto.RoomItemDto.builder()
                .number((String) data.get("number"))
                .building((String) data.get("building"))
                .floor(((Number) data.get("floor")).intValue())
                .capacity(((Number) data.get("capacity")).intValue())
                .type((String) data.get("type"))
                .status((String) data.getOrDefault("status", "enabled"))
                .genderArea((String) data.getOrDefault("gender_area", "女"))
                .notes((String) data.getOrDefault("notes", null))
                .build();
    }

    /**
     * 解析禅堂配置
     */
    private MeditationHallConfigDto.HallRegionDto parseHall(Map<String, Object> data) {
        Map<String, Object> monkSeatsData = (Map<String, Object>) data.get("monk_seats");
        MeditationHallConfigDto.MonkSeatsDto monkSeats = null;
        if (monkSeatsData != null) {
            monkSeats = MeditationHallConfigDto.MonkSeatsDto.builder()
                    .startPosition((String) monkSeatsData.get("start_position"))
                    .maxCount(((Number) monkSeatsData.getOrDefault("max_count", 5)).intValue())
                    .prefix((String) monkSeatsData.getOrDefault("prefix", "M"))
                    .vertical((Boolean) monkSeatsData.getOrDefault("vertical", true))
                    .build();
        }

        return MeditationHallConfigDto.HallRegionDto.builder()
                .code((String) data.get("code"))
                .name((String) data.get("name"))
                .genderType((String) data.getOrDefault("gender_type", "mixed"))
                .description((String) data.getOrDefault("description", ""))
                .regionWidth(((Number) data.get("region_width")).intValue())
                .autoRows((Boolean) data.getOrDefault("auto_rows", true))
                .maxRows(((Number) data.getOrDefault("max_rows", 50)).intValue())
                .numberingType((String) data.getOrDefault("numbering_type", "sequential"))
                .seatPrefix((String) data.get("seat_prefix"))
                .monkSeats(monkSeats)
                .reserveFirstRow((Boolean) data.getOrDefault("reserve_first_row", false))
                .reserveFrontColumns(((Number) data.getOrDefault("reserve_front_columns", 0)).intValue())
                .notes((String) data.getOrDefault("notes", ""))
                .build();
    }

    /**
     * 加载课程会期配置
     */
    private void loadSessionsConfig() throws IOException {
        String sessionsFile = configPath + "/sessions.yaml";
        log.info("加载课程会期配置: {}", sessionsFile);

        Resource resource = new ClassPathResource(sessionsFile);
        if (!resource.exists()) {
            log.warn("课程会期配置文件不存在: {}", sessionsFile);
            return;
        }

        try (InputStream inputStream = resource.getInputStream()) {
            Yaml yaml = new Yaml();
            Map<String, Object> data = yaml.load(inputStream);
            List<Map<String, Object>> sessions = (List<Map<String, Object>>) data.get("sessions");

            if (sessions == null || sessions.isEmpty()) {
                log.warn("课程会期列表为空");
                return;
            }

            int successCount = 0;
            for (Map<String, Object> sessionData : sessions) {
                try {
                    loadSession(sessionData);
                    successCount++;
                } catch (Exception e) {
                    log.error("加载课程会期失败: {}", sessionData, e);
                }
            }
            log.info("课程会期加载完成: 成功 {} 条", successCount);
        }
    }

    /**
     * 保存课程会期及禅堂配置
     */
    private void loadSession(Map<String, Object> sessionData) {
        // 1. 保存课程会期
        Session session = new Session();
        session.setId(((Number) sessionData.get("id")).longValue());
        session.setCenterId(((Number) sessionData.get("center_id")).longValue());
        session.setSessionCode((String) sessionData.get("session_code"));
        session.setCourseType((String) sessionData.get("course_type"));
        session.setStartDate(java.time.LocalDate.parse((String) sessionData.get("start_date")));
        session.setEndDate(java.time.LocalDate.parse((String) sessionData.get("end_date")));
        session.setExpectedStudents(((Number) sessionData.getOrDefault("expected_students", 0)).intValue());
        session.setStatus((String) sessionData.getOrDefault("status", "PLANNING"));
        session.setNotes((String) sessionData.getOrDefault("notes", ""));
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());

        // 检查课程是否存在
        try {
            Session existingSession = sessionMapper.selectById(session.getId());
            if (existingSession == null) {
                sessionMapper.insert(session);
                log.info("新增课程会期: {} ({})", session.getSessionCode(), session.getId());
            } else {
                sessionMapper.update(session);
                log.info("更新课程会期: {} ({})", session.getSessionCode(), session.getId());
            }
        } catch (Exception e) {
            log.warn("课程会期 {} 操作失败: {}", session.getSessionCode(), e.getMessage());
        }

        // 2. 加载禅堂配置
        List<Map<String, Object>> halls = (List<Map<String, Object>>) sessionData.get("meditation_halls");
        if (halls != null && !halls.isEmpty()) {
            for (Map<String, Object> hallData : halls) {
                try {
                    loadSessionHall(session.getId(), session.getCenterId(), hallData);
                } catch (Exception e) {
                    log.error("加载禅堂配置失败: {}", hallData, e);
                }
            }
        }
    }

    /**
     * 保存课程对应的禅堂配置
     */
    private void loadSessionHall(Long sessionId, Long centerId, Map<String, Object> hallData) {
        MeditationHallConfig config = new MeditationHallConfig();
        config.setSessionId(sessionId);
        config.setCenterId(centerId);
        config.setRegionCode((String) hallData.get("region_code"));
        config.setRegionName((String) hallData.get("region_name"));
        config.setHallName((String) hallData.getOrDefault("region_name", ""));
        config.setGenderType((String) hallData.getOrDefault("gender_type", "mixed"));
        config.setRegionWidth(((Number) hallData.get("region_width")).intValue());
        config.setRegionRows(null); // 自动计算
        config.setIsAutoWidth(true);
        config.setIsAutoRows((Boolean) hallData.getOrDefault("auto_rows", true));
        config.setNumberingType((String) hallData.getOrDefault("numbering_type", "SEQUENTIAL"));
        config.setSeatPrefix((String) hallData.get("seat_prefix"));
        config.setSupportedGenders("MIXED");
        config.setHallUsage("SINGLE");
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        // 检查禅堂配置是否存在
        try {
            MeditationHallConfig existingConfig = meditationHallConfigMapper.selectByRegionCode(centerId, (String) hallData.get("region_code"));
            if (existingConfig == null) {
                meditationHallConfigMapper.insert(config);
            } else {
                config.setId(existingConfig.getId());
                meditationHallConfigMapper.update(config);
            }
            log.debug("禅堂配置 {} 保存成功", config.getRegionCode());
        } catch (Exception e) {
            log.warn("禅堂配置 {} 保存失败: {}", config.getRegionCode(), e.getMessage());
        }
    }
}

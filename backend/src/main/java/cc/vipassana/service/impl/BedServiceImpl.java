package cc.vipassana.service.impl;

import cc.vipassana.entity.Bed;
import cc.vipassana.mapper.BedMapper;
import cc.vipassana.service.BedService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 床位业务服务实现
 */
@Slf4j
@Service
public class BedServiceImpl implements BedService {

    @Autowired
    private BedMapper bedMapper;

    @Override
    public List<Bed> getAllBeds() {
        return bedMapper.selectAll();
    }

    @Override
    public List<Bed> getBedsByRoom(Long roomId) {
        List<Bed> allBeds = bedMapper.selectAll();
        return allBeds.stream()
                .filter(b -> roomId.equals(b.getRoomId()))
                .collect(Collectors.toList());
    }

    @Override
    public Bed getBedById(Long id) {
        return bedMapper.selectById(id);
    }

    @Override
    public List<Bed> getBedsByStatus(String status) {
        return bedMapper.selectByStatus(status);
    }

    @Override
    public Long createBed(Bed bed) {
        bed.setCreatedAt(LocalDateTime.now());
        bed.setUpdatedAt(LocalDateTime.now());
        if (bed.getStatus() == null) {
            bed.setStatus("AVAILABLE");
        }
        int result = bedMapper.insert(bed);
        if (result > 0) {
            log.info("创建床位成功: 房间 {} - 床号 {} (ID: {})", bed.getRoomId(), bed.getBedNumber(), bed.getId());
            return bed.getId();
        }
        log.error("创建床位失败");
        return null;
    }

    @Override
    public boolean createBedsBatch(List<Bed> beds) {
        if (beds == null || beds.isEmpty()) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Bed bed : beds) {
            bed.setCreatedAt(now);
            bed.setUpdatedAt(now);
            if (bed.getStatus() == null) {
                bed.setStatus("AVAILABLE");
            }
        }

        int result = bedMapper.insertBatch(beds);
        if (result > 0) {
            log.info("批量创建床位成功，共 {} 个", result);
            return true;
        }
        log.error("批量创建床位失败");
        return false;
    }

    @Override
    public boolean updateBed(Bed bed) {
        bed.setUpdatedAt(LocalDateTime.now());
        int result = bedMapper.update(bed);
        if (result > 0) {
            log.info("更新床位成功: {}", bed.getId());
            return true;
        }
        log.error("更新床位失败: {}", bed.getId());
        return false;
    }

    @Override
    public boolean deleteBed(Long id) {
        int result = bedMapper.delete(id);
        if (result > 0) {
            log.info("删除床位成功: {}", id);
            return true;
        }
        log.error("删除床位失败: {}", id);
        return false;
    }

    @Override
    public boolean deleteBedsOfRoom(Long roomId) {
        List<Bed> beds = getBedsByRoom(roomId);
        for (Bed bed : beds) {
            bedMapper.delete(bed.getId());
        }
        log.info("删除房间 {} 的所有床位，共 {} 个", roomId, beds.size());
        return true;
    }

    @Override
    public int countBeds() {
        return bedMapper.count();
    }

    @Override
    public int countBedsByRoom(Long roomId) {
        List<Bed> beds = getBedsByRoom(roomId);
        return beds.size();
    }

    @Override
    public int countAvailableBeds() {
        List<Bed> beds = getBedsByStatus("AVAILABLE");
        return beds.size();
    }
}

package cc.vipassana.service;

import cc.vipassana.entity.MeditationSeat;
import java.util.List;

/**
 * 禅堂座位服务接口
 * 负责座位生成、分配、交换等操作
 */
public interface MeditationSeatService {

    /**
     * 为给定会期生成禅堂座位
     *
     * @param sessionId 会期ID
     * @return 生成的座位列表
     */
    List<MeditationSeat> generateSeats(Long sessionId);

    /**
     * 根据会期查询座位列表
     *
     * @param sessionId 会期ID
     * @return 座位列表
     */
    List<MeditationSeat> getSeats(Long sessionId);

    /**
     * 根据地区查询座位
     *
     * @param sessionId 会期ID
     * @param regionCode 地区代码 (A / B)
     * @return 座位列表
     */
    List<MeditationSeat> getSeatsByRegion(Long sessionId, String regionCode);

    /**
     * 交换两个座位的学员
     *
     * @param seatId1 座位1 ID
     * @param seatId2 座位2 ID
     */
    void swapSeats(Long seatId1, Long seatId2);

    /**
     * 为学员分配座位
     *
     * @param studentId 学员ID
     * @param seatId 座位ID
     */
    void assignSeat(Long studentId, Long seatId);

    /**
     * 删除会期的所有座位（重新生成前）
     *
     * @param sessionId 会期ID
     */
    void deleteSessionSeats(Long sessionId);

    /**
     * 获取座位占用统计
     *
     * @param sessionId 会期ID
     * @return 占用统计信息
     */
    SeatStatistics getStatistics(Long sessionId);

    /**
     * 座位占用统计
     */
    class SeatStatistics {
        public Integer totalSeats;
        public Integer occupiedSeats;
        public Integer availableSeats;
        public Double occupancyRate;
    }
}

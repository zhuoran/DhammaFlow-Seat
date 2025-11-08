package cc.vipassana.util;

import cc.vipassana.entity.Student;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 同伴座位处理助手类
 * 负责识别、分组和管理同伴座位分配
 */
@Slf4j
public class CompanionSeatHelper {

    /**
     * 同伴座位组内信息
     */
    @Data
    public static class CompanionGroup {
        private Integer groupId;           // 同伴组ID
        private List<Student> members;     // 组内学员列表
        private int size;                  // 组内学员数

        public CompanionGroup(Integer groupId, List<Student> members) {
            this.groupId = groupId;
            this.members = new ArrayList<>(members);
            this.size = members.size();
        }

        /**
         * 判断是否为有效的同伴对（恰好2人）
         */
        public boolean isPerfectPair() {
            return size == 2;
        }

        /**
         * 获取同伴对的首选方向（优先右侧）
         */
        public String getPreferredSide() {
            return "right";
        }
    }

    /**
     * 座位位置信息
     */
    @Data
    public static class SeatPosition {
        private int row;
        private int col;

        public SeatPosition(int row, int col) {
            this.row = row;
            this.col = col;
        }

        /**
         * 检查两个座位是否相邻（上下或左右）
         */
        public boolean isAdjacentTo(SeatPosition other) {
            // 上下相邻
            if (this.col == other.col && Math.abs(this.row - other.row) == 1) {
                return true;
            }
            // 左右相邻
            if (this.row == other.row && Math.abs(this.col - other.col) == 1) {
                return true;
            }
            return false;
        }

        @Override
        public String toString() {
            return "(" + row + "," + col + ")";
        }
    }

    /**
     * 将学员按同伴组分组
     *
     * @param students 学员列表
     * @return 同伴组列表和单独学员列表
     */
    public static Map<String, Object> groupByCompanion(List<Student> students) {
        Map<String, Object> result = new HashMap<>();

        // 按fellowGroupId分组（非null）
        Map<Integer, List<Student>> companionGroups = students.stream()
                .filter(s -> s.getFellowGroupId() != null)
                .collect(Collectors.groupingBy(Student::getFellowGroupId));

        // 创建CompanionGroup对象
        List<CompanionGroup> groups = companionGroups.entrySet().stream()
                .map(e -> new CompanionGroup(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(CompanionGroup::getSize).reversed())
                .collect(Collectors.toList());

        // 获取没有同伴的学员
        Set<Integer> companionGroupIds = companionGroups.keySet();
        List<Student> soloStudents = students.stream()
                .filter(s -> s.getFellowGroupId() == null || !companionGroupIds.contains(s.getFellowGroupId()))
                .collect(Collectors.toList());

        result.put("companionGroups", groups);
        result.put("soloStudents", soloStudents);

        log.info("同伴分组完成: {}个同伴组, {}个单独学员",
                groups.size(), soloStudents.size());

        return result;
    }

    /**
     * 判断座位是否在禅堂右侧
     *
     * @param colIndex 列索引
     * @param regionWidth 禅堂宽度
     * @return true 如果在右侧
     */
    public static boolean isOnRightSide(int colIndex, int regionWidth) {
        // 右侧为后一半的列
        return colIndex >= regionWidth / 2;
    }

    /**
     * 计算相对于右侧的距离（右侧优先度）
     * 距离越小，越靠右
     *
     * @param colIndex 列索引
     * @param regionWidth 禅堂宽度
     * @return 距离值
     */
    public static int rightSideDistance(int colIndex, int regionWidth) {
        return regionWidth - 1 - colIndex;
    }

    /**
     * 验证座位是否满足同伴要求
     *
     * @param seat1Position 座位1位置
     * @param seat2Position 座位2位置
     * @return true 如果相邻
     */
    public static boolean validateCompanionSeats(SeatPosition seat1Position, SeatPosition seat2Position) {
        return seat1Position.isAdjacentTo(seat2Position);
    }

    /**
     * 记录同伴分配结果
     *
     * @param companionGroup 同伴组
     * @param assigned 是否成功分配为相邻座位
     */
    public static void logCompanionAllocation(CompanionGroup companionGroup, boolean assigned) {
        if (assigned) {
            log.info("同伴组 {} 分配成功，{}人相邻座位",
                    companionGroup.getGroupId(), companionGroup.getSize());
        } else {
            log.warn("同伴组 {} 分配失败，{}人无法分配相邻座位",
                    companionGroup.getGroupId(), companionGroup.getSize());
        }
    }
}

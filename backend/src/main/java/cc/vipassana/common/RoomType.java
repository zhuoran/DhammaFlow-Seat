package cc.vipassana.common;

/**
 * 房间类型常量
 * 对应数据库 room.room_type 字段的可选值
 *
 * 映射关系（VBA宏 → Java常量）：
 * - "出家师" → MONK (法师房)
 * - "旧生"   → OLD_STUDENT (旧生房)
 * - "新生"   → NEW_STUDENT (新生房)
 * - "老人1"  → ELDERLY (老人房, specialTag="老人1")
 * - "老人2"  → ELDERLY (老人房, specialTag="老人2")
 */
public class RoomType {

    /** 法师房 - 对应VBA宏中的"出家师" */
    public static final String MONK = "法师房";

    /** 旧生房 - 对应VBA宏中的"旧生" */
    public static final String OLD_STUDENT = "旧生房";

    /** 新生房 - 对应VBA宏中的"新生" */
    public static final String NEW_STUDENT = "新生房";

    /** 老人房 - 对应VBA宏中的"老人1"和"老人2"，通过Room.specialTag字段区分 */
    public static final String ELDERLY = "老人房";

    /** 老师房 */
    public static final String TEACHER = "老师房";

    /** 义工房 */
    public static final String VOLUNTEER = "义工房";

    /** 其他 */
    public static final String OTHER = "其他";

    /**
     * 特殊标签 - 老人房子分类
     */
    public static class SpecialTag {
        /** 老人房1 - 优先分配的老人房 */
        public static final String ELDERLY_1 = "老人1";

        /** 老人房2 - 次优先分配的老人房 */
        public static final String ELDERLY_2 = "老人2";
    }

    /**
     * 检查给定的房间类型是否有效
     *
     * @param roomType 房间类型
     * @return true 如果有效
     */
    public static boolean isValid(String roomType) {
        return MONK.equals(roomType) ||
               OLD_STUDENT.equals(roomType) ||
               NEW_STUDENT.equals(roomType) ||
               ELDERLY.equals(roomType) ||
               TEACHER.equals(roomType) ||
               VOLUNTEER.equals(roomType) ||
               OTHER.equals(roomType);
    }

    /**
     * 获取VBA宏对应的房间类型
     *
     * @param vbaType VBA宏中的房间类型标识
     * @return Java常量中的房间类型
     */
    public static String fromVbaType(String vbaType) {
        switch (vbaType) {
            case "出家师":
                return MONK;
            case "旧生":
                return OLD_STUDENT;
            case "新生":
                return NEW_STUDENT;
            case "老人1":
            case "老人2":
                return ELDERLY;
            default:
                return OTHER;
        }
    }

    private RoomType() {
        // 工具类，禁止实例化
    }
}

package cc.vipassana.service.allocation;

import cc.vipassana.entity.Allocation;
import cc.vipassana.entity.Student;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 同伴分离器
 * 对应VBA宏中的SplitFellow函数
 * 用于确保同伴组成员不在同一房间
 */
public class CompanionSplitter {

    private final Random random;

    public CompanionSplitter() {
        this.random = new Random();
    }

    /**
     * 执行同伴分离（原地修改）
     * 通过交换不同房间的学员来确保同伴不在同一房间
     *
     * @param allocations 当前分配结果（原地修改）
     * @param students 学员列表
     */
    public void splitCompanions(List<Allocation> allocations, List<Student> students) {
        // 按房间分组
        Map<Long, List<Allocation>> roomGroups = allocations.stream()
                .collect(Collectors.groupingBy(Allocation::getRoomId));

        // 构建学员ID到学员对象的映射
        Map<Long, Student> studentMap = students.stream()
                .collect(Collectors.toMap(Student::getId, s -> s));

        // 检测每个房间内的同伴冲突
        for (Map.Entry<Long, List<Allocation>> entry : roomGroups.entrySet()) {
            Long roomId = entry.getKey();
            List<Allocation> roomAllocations = entry.getValue();

            // 查找房间内的同伴组
            Map<Integer, List<Allocation>> companionGroups = findCompanionGroupsInRoom(
                    roomAllocations, studentMap);

            // 如果有同伴在同一房间，进行交换
            for (Map.Entry<Integer, List<Allocation>> companionEntry : companionGroups.entrySet()) {
                if (companionEntry.getValue().size() > 1) {
                    // 尝试将同伴成员交换到其他房间
                    swapCompanionsToOtherRooms(
                            companionEntry.getValue(),
                            roomId,
                            roomGroups,
                            studentMap);
                }
            }
        }
    }

    /**
     * 查找房间内的同伴组
     */
    private Map<Integer, List<Allocation>> findCompanionGroupsInRoom(
            List<Allocation> roomAllocations,
            Map<Long, Student> studentMap) {

        Map<Integer, List<Allocation>> companionGroups = new HashMap<>();

        for (Allocation allocation : roomAllocations) {
            Student student = studentMap.get(allocation.getStudentId());
            if (student != null && student.getFellowGroupId() != null) {
                companionGroups
                        .computeIfAbsent(student.getFellowGroupId(), k -> new ArrayList<>())
                        .add(allocation);
            }
        }

        return companionGroups;
    }

    /**
     * 将同伴成员交换到其他房间
     */
    private void swapCompanionsToOtherRooms(
            List<Allocation> companions,
            Long currentRoomId,
            Map<Long, List<Allocation>> roomGroups,
            Map<Long, Student> studentMap) {

        // 保留一个同伴在当前房间，其他成员交换出去
        for (int i = 1; i < companions.size(); i++) {
            Allocation companionToMove = companions.get(i);
            Student companionStudent = studentMap.get(companionToMove.getStudentId());

            // 查找可以交换的目标房间
            for (Map.Entry<Long, List<Allocation>> targetEntry : roomGroups.entrySet()) {
                Long targetRoomId = targetEntry.getKey();

                // 跳过当前房间
                if (targetRoomId.equals(currentRoomId)) {
                    continue;
                }

                List<Allocation> targetRoomAllocations = targetEntry.getValue();

                // 查找目标房间中可以交换的学员（非同伴组或不同伴组）
                Optional<Allocation> swapTarget = findSwapTarget(
                        targetRoomAllocations,
                        companionStudent.getFellowGroupId(),
                        studentMap);

                if (swapTarget.isPresent()) {
                    // 执行交换
                    swapRooms(companionToMove, swapTarget.get());
                    break;
                }
            }
        }
    }

    /**
     * 查找可以交换的目标学员
     */
    private Optional<Allocation> findSwapTarget(
            List<Allocation> targetRoomAllocations,
            Integer excludeFellowGroupId,
            Map<Long, Student> studentMap) {

        return targetRoomAllocations.stream()
                .filter(allocation -> {
                    Student student = studentMap.get(allocation.getStudentId());
                    // 目标学员不能是同一个同伴组
                    return student == null ||
                            student.getFellowGroupId() == null ||
                            !student.getFellowGroupId().equals(excludeFellowGroupId);
                })
                .findFirst();
    }

    /**
     * 交换两个学员的房间
     */
    private void swapRooms(Allocation allocation1, Allocation allocation2) {
        Long tempRoomId = allocation1.getRoomId();
        Integer tempBedNumber = allocation1.getBedNumber();

        allocation1.setRoomId(allocation2.getRoomId());
        allocation1.setBedNumber(allocation2.getBedNumber());

        allocation2.setRoomId(tempRoomId);
        allocation2.setBedNumber(tempBedNumber);
    }

    /**
     * 设置随机种子（用于测试）
     */
    public void setSeed(long seed) {
        this.random.setSeed(seed);
    }
}

package cc.vipassana.service;

import cc.vipassana.entity.*;
import cc.vipassana.mapper.*;
import cc.vipassana.service.impl.AllocationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 房间分配集成测试
 * 测试完整的分配流程
 */
@SpringBootTest
@Transactional
class AllocationIntegrationTest {

    @Autowired
    private AllocationService allocationService;

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private AllocationMapper allocationMapper;

    @Autowired
    private RoomMapper roomMapper;

    private Long testSessionId = 61L;

    @BeforeEach
    void setUp() {
        // 清理测试数据
        allocationMapper.deleteBySessionId(testSessionId);
    }

    @Test
    void testFullAllocationFlow() {
        // 执行自动分配
        AllocationService.AllocationResult result = allocationService.autoAllocate(testSessionId);

        // 验证分配结果
        assertNotNull(result);
        assertTrue(result.success, "分配应该成功");
        assertEquals(83, result.totalStudents, "应该有83名学员");
        assertEquals(83, result.allocatedCount, "应该全部分配");

        // 验证统计信息
        assertNotNull(result.statistics);
        assertEquals(5L, result.statistics.get("monkCount"));
        assertEquals(42L, result.statistics.get("oldStudentCount"));
        assertEquals(36L, result.statistics.get("newStudentCount"));
    }

    @Test
    void testCapacityOverflowDetection() {
        // 获取学员列表
        List<Student> students = studentMapper.selectBySessionId(testSessionId);
        assertTrue(students.size() > 0, "应该有测试学员");

        // 执行分配
        double score = allocationService.allocateBeds(testSessionId, students);

        // 验证分配分数
        assertTrue(score > 0.9, "分配成功率应该超过90%");
    }

    @Test
    void testCompanionSeparation() {
        // 执行分配
        allocationService.autoAllocate(testSessionId);

        // 获取所有分配
        List<Allocation> allocations = allocationMapper.selectBySessionId(testSessionId);

        // 验证同伴组成员不在同一房间
        List<Student> students = studentMapper.selectBySessionId(testSessionId);
        for (Student student : students) {
            if (student.getFellowGroupId() == null) continue;

            // 查找同伴组其他成员
            List<Student> companions = studentMapper.selectByFellowGroupId(
                    student.getFellowGroupId());

            Allocation studentAllocation = allocations.stream()
                    .filter(a -> a.getStudentId().equals(student.getId()))
                    .findFirst()
                    .orElse(null);

            if (studentAllocation != null) {
                for (Student companion : companions) {
                    if (companion.getId().equals(student.getId())) continue;

                    Allocation companionAllocation = allocations.stream()
                            .filter(a -> a.getStudentId().equals(companion.getId()))
                            .findFirst()
                            .orElse(null);

                    if (companionAllocation != null) {
                        assertNotEquals(studentAllocation.getRoomId(),
                                companionAllocation.getRoomId(),
                                "同伴不应该在同一房间");
                    }
                }
            }
        }
    }
}

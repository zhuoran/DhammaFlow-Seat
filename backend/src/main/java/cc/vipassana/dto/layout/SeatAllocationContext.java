package cc.vipassana.dto.layout;

import cc.vipassana.entity.Student;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class SeatAllocationContext {
    private CompiledLayout layout;
    @Builder.Default
    private List<Student> monks = new ArrayList<>();
    @Builder.Default
    private List<Student> oldStudents = new ArrayList<>();
    @Builder.Default
    private List<Student> newStudents = new ArrayList<>();
}

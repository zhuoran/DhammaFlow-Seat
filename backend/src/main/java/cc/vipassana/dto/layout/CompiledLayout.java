package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LayoutCompiler 的输出结果。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompiledLayout {
    private int totalRows;
    private int totalCols;
    @Builder.Default
    private List<SeatCell> cells = new ArrayList<>();
    @Builder.Default
    private Map<String, SeatSection> sections = new HashMap<>();
    private HallLayout source;
}

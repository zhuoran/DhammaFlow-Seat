package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 禅堂布局配置的结构化模型，替代 Excel 坐标体系。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HallLayout {
    @Builder.Default
    private Integer originRow = 0;
    @Builder.Default
    private Integer originCol = 0;
    private Integer totalRows;
    private Integer totalCols;
    @Builder.Default
    private Boolean autoRows = true;
    @Builder.Default
    private Boolean autoCols = false;
    private Integer rowSpacing;
    private Integer colSpacing;
    @Builder.Default
    private List<SeatSection> sections = new ArrayList<>();
    @Builder.Default
    private List<ReservedSlot> reservedSlots = new ArrayList<>();
    private MonkSeatConfig monkSeats;
    private NumberingConfig numbering;
    @Builder.Default
    private List<HighlightRule> highlightRules = new ArrayList<>();
    @Builder.Default
    private List<String> supportedGenders = new ArrayList<>();
    private String usageMode;

    public List<SeatSection> getSections() {
        if (sections == null) {
            return Collections.emptyList();
        }
        return sections;
    }

    public List<ReservedSlot> getReservedSlots() {
        if (reservedSlots == null) {
            return Collections.emptyList();
        }
        return reservedSlots;
    }

    public List<String> getSupportedGenders() {
        if (supportedGenders == null) {
            return Collections.emptyList();
        }
        return supportedGenders;
    }

    public List<HighlightRule> getHighlightRules() {
        if (highlightRules == null) {
            return Collections.emptyList();
        }
        return highlightRules;
    }
}

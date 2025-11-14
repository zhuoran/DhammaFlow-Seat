package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 禅堂中的功能区域，用于描述旧生区、新生区、预留区等。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatSection {
    private String name;
    private SeatSectionPurpose purpose;
    private Integer rowStart;
    private Integer rowEnd;
    private Integer colStart;
    private Integer colEnd;
    @Builder.Default
    private FillDirection fillDirection = FillDirection.ROW_MAJOR;
    private NumberingConfig numberingOverride;
    private Integer capacity;
}

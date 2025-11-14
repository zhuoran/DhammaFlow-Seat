package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 编译后的单个座位格子。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatCell {
    private int row;
    private int col;
    private String sectionName;
    private SeatSectionPurpose purpose;
    @Builder.Default
    private boolean reserved = false;
}

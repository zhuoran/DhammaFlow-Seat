package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 法师座位配置。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonkSeatConfig {
    private Integer startRow;
    private Integer startCol;
    @Builder.Default
    private FillDirection direction = FillDirection.COLUMN_MAJOR;
    @Builder.Default
    private Integer spacing = 3;
    private Integer maxCount;
    private String prefix;
}

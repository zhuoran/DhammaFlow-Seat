package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 座位编号配置。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NumberingConfig {
    @Builder.Default
    private NumberingMode mode = NumberingMode.SEQUENTIAL;
    @Builder.Default
    private Integer start = 1;
    private String prefix;
    @Builder.Default
    private RenumberPolicy renumberPolicy = RenumberPolicy.ON_GENERATE;
}

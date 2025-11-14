package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 需要保留或留空的单元格。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservedSlot {
    private Integer row;
    private Integer col;
    @Builder.Default
    private Boolean blocked = true;
}

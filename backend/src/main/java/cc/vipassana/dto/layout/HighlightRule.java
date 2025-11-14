package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 座位标记规则，例如孕妇、老人等。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HighlightRule {
    private String code;
    private String expression;
    private String tag;
    private String color;
}

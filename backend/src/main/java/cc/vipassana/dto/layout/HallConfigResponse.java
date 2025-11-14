package cc.vipassana.dto.layout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HallConfigResponse {
    private Long id;
    private Long centerId;
    private Long sessionId;
    private String regionCode;
    private String regionName;
    private HallLayout layout;
}

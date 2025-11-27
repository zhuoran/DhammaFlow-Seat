package cc.vipassana.dto.layout;

import lombok.Data;

@Data
public class UpsertHallLayoutRequest {
    private Long sessionId;
    private Long centerId;
    private HallLayout layout;
    private String templateId;
    private String numberingType;
    private String hallUsage;
}

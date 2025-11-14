package cc.vipassana.controller;

import cc.vipassana.common.ResponseResult;
import cc.vipassana.dto.layout.CompiledLayout;
import cc.vipassana.dto.layout.HallConfigResponse;
import cc.vipassana.dto.layout.UpdateHallLayoutRequest;
import cc.vipassana.service.MeditationHallConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hall-configs")
@RequiredArgsConstructor
@Slf4j
public class MeditationHallConfigController {

    private final MeditationHallConfigService hallConfigService;

    @GetMapping
    public ResponseResult<ResponseResult.ListData<HallConfigResponse>> list(@RequestParam Long sessionId) {
        List<HallConfigResponse> configs = hallConfigService.listBySession(sessionId);
        return new ResponseResult<>(0, "获取禅堂配置成功", new ResponseResult.ListData<>(configs));
    }

    @PutMapping("/{id}/layout")
    public ResponseResult<HallConfigResponse> updateLayout(
            @PathVariable Long id,
            @RequestBody UpdateHallLayoutRequest request) {
        HallConfigResponse response = hallConfigService.updateLayout(id, request.getLayout());
        return new ResponseResult<>(0, "更新禅堂配置成功", response);
    }

    @PostMapping("/{id}/compile")
    public ResponseResult<CompiledLayout> compile(@PathVariable Long id) {
        CompiledLayout compiled = hallConfigService.compile(id);
        return new ResponseResult<>(0, "编译禅堂配置成功", compiled);
    }
}

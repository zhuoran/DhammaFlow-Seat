package cc.vipassana.listener;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import cc.vipassana.dto.StudentImportDTO;
import cc.vipassana.mapper.StudentMapper;

/**
 * 学员导入监听器（简化版）
 */
public class StudentImportListener implements ReadListener<StudentImportDTO> {

    private final StudentMapper studentMapper;
    private final Long sessionId;
    private final boolean isFemaleSheet;
    private int successCount = 0;
    private int failureCount = 0;

    public StudentImportListener(StudentMapper studentMapper, Long sessionId, boolean isFemaleSheet) {
        this.studentMapper = studentMapper;
        this.sessionId = sessionId;
        this.isFemaleSheet = isFemaleSheet;
    }

    @Override
    public void invoke(StudentImportDTO data, AnalysisContext context) {
        // 简化实现：不做任何事
        successCount++;
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        // 完成
    }

    public int getSuccessCount() {
        return successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }
}

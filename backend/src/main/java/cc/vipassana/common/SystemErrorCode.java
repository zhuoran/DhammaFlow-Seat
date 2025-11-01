package cc.vipassana.common;


import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public enum SystemErrorCode implements ErrorCode {
    OLD_SUCCESS(0, "i18n.error.code.sys.success"),
    SUCCESS(200, "i18n.error.code.sys.success"),
    SYSTEM_ERROR(1, "i18n.error.code.sys.error"),
    UNKNOWN_ERROR(-1, "i18n.error.code.sys.unknow"),
    API_DISABLED(-2, "i18n.error.code.sys.apidisabled"),
    NOT_LOGIN(401, "i18n.error.code.sys.notlogin"),
    FORBIDDEN(403, "i18n.error.code.sys.forbidden"),
    NOT_FOUND(404, "i18n.error.code.sys.notfound"),
    METHOD_NOT_ALLOWED(405, "i18n.error.code.sys.methodnotallowed"),

    /**
     * 系统异常 500 服务器的内部错误
     */
    EXCEPTION(500, "服务器开小差，请稍后再试"),

    /**
     * 系统限流
     */
    TRAFFIC_LIMITING(429, "哎呀，网络拥挤请稍后再试试"),

    /**
     * 服务调用异常
     */
    API_GATEWAY_ERROR(9999, "网络繁忙，请稍后再试"),

    /**
     * 参数错误
     */
    PARAM_ERROR(400, "参数校验失败"),

    /**
     * 业务异常
     */
    BUSINESS_ERROR(503, "业务异常或服务不可用"),

    /**
     * 非法请求
     */
    ILLEGAL_REQUEST(512, "非法请求"),

    /**
     * rpc调用异常
     */
    RPC_ERROR(510, "呀，网络出问题啦！"),

    HTTP_MESSAGE_NOT_READABLE(900, "i18n.error.code.sys.900"),
    DATA_VALIDATION_FAILURE(901, "i18n.error.code.sys.901"),
    DATA_BIND_VALIDATION_FAILURE(902, "i18n.error.code.sys.902"),
    SQL_EXECUTE_FAILURE(903, "i18n.error.code.sys.903"),
    DATA_NOT_FOUND(905,"i18n.error.code.biz.data_not_found"),
    METHOD_ARGUMENT_NOT_VALID(904, "i18n.error.code.sys.902");

    private final int code;
    private final String message;

    public static Map<Integer, String> valueMap;

    static {
        valueMap = new HashMap<>(SystemErrorCode.values().length);
        for (SystemErrorCode error : SystemErrorCode.values()) {
            valueMap.put(error.getCode(),error.getMessage());
        }
    }


    SystemErrorCode(final int code, final String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * @param code
     * @return
     */
    public static SystemErrorCode valueOf(final int code) {
        return Arrays.stream(SystemErrorCode.values())
                .filter(x -> x.getCode() == code)
                .findFirst()
                .orElse(SystemErrorCode.UNKNOWN_ERROR);
    }

    @Override
    public int getCode() {
        return this.code;
    }

    @Override
    public String getMessage() {
        return this.message;
    }

    @Override
    public String toString() {
        return "[" + this.getCode() + "]" + this.getMessage();
    }


}

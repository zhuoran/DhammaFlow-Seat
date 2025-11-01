package cc.vipassana.common;

import java.io.Serializable;
import java.util.List;

public class ResponseResult<T> implements Serializable {
    private static final long serialVersionUID = 970471064367090687L;
    /**
     * 0表示成功，>0表示失败,<0系统保留
     */
    private int code;

    /**
     * 提示信息
     */
    private String msg;

    /**
     * 返回数据
     */
    private T data;

    public ResponseResult() {
      
    }


    public ResponseResult(int code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "ResponseResult{" +
                "code=" + code +
                ", msg='" + msg + '\'' +
                ", data=" + data +
                '}';
    }

    public static class ListData<T> implements Serializable {
        private static final long serialVersionUID = -679239523154281925L;

        public ListData() {
        }

        private List<T> list;

        public List<T> getList() {
            return list;
        }

        public void setList(List<T> list) {
            this.list = list;
        }

        public ListData(List<T> list) {
            this.list = list;
        }
    }
}

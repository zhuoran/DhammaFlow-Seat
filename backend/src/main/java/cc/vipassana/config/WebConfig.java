package cc.vipassana.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 配置类
 * 配置CORS跨域请求
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * 配置CORS跨域请求
     * 允许前端 localhost、本地IP 和 局域网IP 访问后端 API
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // 允许所有 HTTP 和 HTTPS 请求源（开发环境）
                // 生产环境应该改为具体的域名
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}

package cc.vipassana.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 (Swagger) 配置
 * 配置 API 文档的基本信息
 */
@Configuration
public class OpenApiConfig {

    /**
     * 配置 OpenAPI 文档
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("禅修排床系统 - API 文档")
                        .description("禅修中心智能排床系统后端 REST API")
                        .version("1.0.0"));
    }
}

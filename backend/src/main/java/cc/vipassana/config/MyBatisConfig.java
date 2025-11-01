package cc.vipassana.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

/**
 * MyBatis配置类
 * 配置SqlSessionFactory和Mapper扫描路径
 */
@Configuration
@MapperScan(
    basePackages = "cc.vipassana.mapper",
    sqlSessionFactoryRef = "sqlSessionFactory"
)
public class MyBatisConfig {

    /**
     * 配置SqlSessionFactory
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);

        // 设置Mapper XML文件位置
        sqlSessionFactoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources("classpath:mybatis/**/*.xml")
        );

        // 设置类别名包
        sqlSessionFactoryBean.setTypeAliasesPackage("cc.vipassana.entity");

        // MyBatis配置
        org.apache.ibatis.session.Configuration configuration =
            new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);  // 下划线转驼峰
        configuration.setUseGeneratedKeys(true);           // 使用生成的主键
        configuration.setDefaultExecutorType(
            org.apache.ibatis.session.ExecutorType.REUSE   // 连接复用
        );
        configuration.setDefaultStatementTimeout(30);      // 默认语句超时
        configuration.setCacheEnabled(true);               // 启用缓存

        sqlSessionFactoryBean.setConfiguration(configuration);

        return sqlSessionFactoryBean.getObject();
    }
}

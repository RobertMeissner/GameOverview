/* (C)2025 */
package com.robertforpresent.spring_api.config;

import javax.sql.DataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class H2DataSourceConfig {

    @Bean
    @Primary
    public DataSource h2DataSource() {
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:gamedb")
                .username("sa")
                .password("")
                .build();
    }
}

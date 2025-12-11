/* (C)2025 */
package com.robertforpresent.api.config;

import javax.sql.DataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * In memory database. Needed for testing and data seeding.
 * <p> At this projects current state, a persistent storage adds no value. In memory pre-seeded is enough.</p>
 */
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

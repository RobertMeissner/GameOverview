package com.robertforpresent.spring_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.SimpleDriverDataSource;

import javax.sql.DataSource;
import java.sql.Driver;

@Configuration
public class DuckDBConfig {

    @Bean("duckDB")
    public DataSource duckDBDataSource() throws Exception {
        Class.forName("org.duckdb.DuckDBDriver");

        SimpleDriverDataSource dataSource = new SimpleDriverDataSource();
        dataSource.setDriver((Driver) Class.forName("org.duckdb.DuckDBDriver").getDeclaredConstructor().newInstance());
        dataSource.setUrl("jdbc:duckdb:");
        return dataSource;
    }
}
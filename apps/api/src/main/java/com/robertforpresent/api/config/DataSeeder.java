package com.robertforpresent.api.config;

import com.robertforpresent.api.games.domain.Game;
import com.robertforpresent.api.games.domain.repository.GameRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;


import javax.sql.DataSource;
import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final GameRepository gameRepository;
    private final DataSource duckDBDataSource;
    @Value("${game.data.legacy.path}")
    private Resource parquetPath;

    public DataSeeder(GameRepository gameRepository, @Qualifier("duckDB")DataSource duckDBDataSource) {
        this.gameRepository = gameRepository;
        this.duckDBDataSource = duckDBDataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        if (gameRepository.findAll().isEmpty()) {
            log.debug("H2 database empty. Seeding now with test games.");
            seedGames();
        }
    }

    private String thumbnail(int appId) {
        return String.format("https://steamcdn-a.akamaihd.net/steam/apps/%s/header.jpg", appId);
    }

    private void seedGames() throws IOException, SQLException {
        String parquetFile = parquetPath.getFilePath().toAbsolutePath().toString();

        try (Connection conn = duckDBDataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT * FROM read_parquet('" + parquetFile + "')")) {

            List<Game> batch = new ArrayList<>();
            while (rs.next()) {
                batch.add(mapToGame(rs));
            }
            batch.forEach(gameRepository::save);
            log.debug("{} games added", batch);
        }

    }

    private Game mapToGame(ResultSet set) throws SQLException {
        return Game.builder().name(set.getString("name")).rating(set.getFloat("rating")).thumbnailUrl(thumbnail(set.getInt( "app_id"))).build();
    }

}

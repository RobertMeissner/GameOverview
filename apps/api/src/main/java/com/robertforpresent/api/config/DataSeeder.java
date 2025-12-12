package com.robertforpresent.api.config;

import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.collection.infrastructure.persistence.PersonalizedGameEntity;
import com.robertforpresent.api.collection.infrastructure.persistence.SpringDataCollectionRepository;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
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
import java.util.UUID;

@Component
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final CanonicalGameRepository canonicalGameRepository;
    private final DataSource duckDBDataSource;
    private final SpringDataCollectionRepository collectionRepository;

    @Value("${game.data.legacy.path}")
    private Resource parquetPath;

    // Hardcoded test user
    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    public DataSeeder(CanonicalGameRepository canonicalGameRepository, @Qualifier("duckDB") DataSource duckDBDataSource, SpringDataCollectionRepository collectionRepository) {
        this.canonicalGameRepository = canonicalGameRepository;
        this.duckDBDataSource = duckDBDataSource;
        this.collectionRepository = collectionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (canonicalGameRepository.findAll().isEmpty()) {
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

            List<CanonicalGame> batch = new ArrayList<>();
            while (rs.next()) {
                batch.add(mapToGame(rs));
            }
            List<CanonicalGame> savedGames = batch.stream().map(canonicalGameRepository::save).toList();

            savedGames.forEach(game -> {
                collectionRepository.save(new PersonalizedGameEntity(TEST_USER_ID, game.getId()));
            });
            log.debug("{} games added to catalog and test user collection", batch.size());
        }

    }

    private CanonicalGame mapToGame(ResultSet set) throws SQLException {

        return new CanonicalGame.Builder(set.getString("name"))
                .setSteamRating(new SteamRating(set.getInt("total_positive"),
                        set.getInt("total_negative"),
                        ReviewSentiment.fromScore(set.getInt("review_score"))))
                .setThumbnailUrl(thumbnail(set.getInt("app_id")))
                .build();
    }

}

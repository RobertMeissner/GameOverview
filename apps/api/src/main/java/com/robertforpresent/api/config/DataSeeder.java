package com.robertforpresent.api.config;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.infrastructure.persistence.PersonalizedGameEntity;
import com.robertforpresent.api.collection.infrastructure.persistence.SpringDataCollectionRepository;
import com.robertforpresent.api.config.legacy.LegacyGame;
import com.robertforpresent.api.config.legacy.LegacyGameMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final CanonicalGameRepository canonicalGameRepository;
    private final DataSource duckDBDataSource;
    private final SpringDataCollectionRepository collectionRepository;
    private final LegacyGameMapper legacyGameMapper;

    @Value("${game.data.legacy.path}")
    private Resource parquetPath;

    // Hardcoded test user
    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    public DataSeeder(
            CanonicalGameRepository canonicalGameRepository,
            @Qualifier("duckDB") DataSource duckDBDataSource,
            SpringDataCollectionRepository collectionRepository,
            LegacyGameMapper legacyGameMapper) {
        this.canonicalGameRepository = canonicalGameRepository;
        this.duckDBDataSource = duckDBDataSource;
        this.collectionRepository = collectionRepository;
        this.legacyGameMapper = legacyGameMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        if (canonicalGameRepository.findAll().isEmpty()) {
            log.debug("H2 database empty. Seeding now with test games.");
            seedGames();
        }
    }

    private record SavedGameWithUserState(CanonicalGame saved, LegacyGame.UserState userState) {
    }

    private void seedGames() throws IOException, SQLException {
        String parquetFile = parquetPath.getFilePath().toAbsolutePath().toString();

        try (Connection conn = duckDBDataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT * FROM read_parquet('" + parquetFile + "')")) {

            List<LegacyGame> legacyGames = new ArrayList<>();
            while (rs.next()) {
                legacyGames.add(mapToLegacyGame(rs));
            }


            List<SavedGameWithUserState> savedWithState = legacyGames.stream()
                    .map(legacy -> new SavedGameWithUserState(
                            canonicalGameRepository.save(legacyGameMapper.toCanonicalGame(legacy)),
                            legacy.userState()))
                    .toList();

            savedWithState.forEach(pair -> {
                PersonalizedGameEntity entity = new PersonalizedGameEntity(TEST_USER_ID, pair.saved().getId()
                        , pair.userState.played(), pair.userState.hide(), pair.userState.later());
                collectionRepository.save(entity);
            });

            log.debug("{} games added to catalog and test user collection", savedWithState.size());
        }
    }

    private LegacyGame mapToLegacyGame(ResultSet rs) throws SQLException {
        return new LegacyGame(
                mapIdentity(rs),
                mapSteamData(rs),
                mapGogData(rs),
                mapRatings(rs),
                mapHltbData(rs),
                mapUserState(rs)
        );
    }

    private LegacyGame.Identity mapIdentity(ResultSet rs) throws SQLException {
        return new LegacyGame.Identity(
                rs.getString("name"),
                rs.getString("title"),
                rs.getString("found_game_name"),
                rs.getString("store"),
                getLongOrNull(rs, "app_id"),
                getLongOrNull(rs, "corrected_app_id"),
                getLongOrNull(rs, "gog_id"),
                rs.getString("game_hash"),
                rs.getString("url"),
                rs.getString("thumbnail_url")
        );
    }

    private LegacyGame.SteamData mapSteamData(ResultSet rs) throws SQLException {
        return new LegacyGame.SteamData(
                getLongOrNull(rs, "total_positive"),
                getLongOrNull(rs, "total_negative"),
                getLongOrNull(rs, "total_reviews"),
                getLongOrNull(rs, "num_reviews"),
                getLongOrNull(rs, "review_score"),
                rs.getString("review_score_desc"),
                getFloatOrNull(rs, "rating"),
                rs.getString("img_icon_url"),
                mapPlaytime(rs),
                rs.getString("has_community_visible_stats"),
                rs.getString("has_leaderboards"),
                rs.getString("content_descriptorids")
        );
    }

    private LegacyGame.Playtime mapPlaytime(ResultSet rs) throws SQLException {
        return new LegacyGame.Playtime(
                getLongOrNull(rs, "playtime_forever"),
                getLongOrNull(rs, "playtime_windows_forever"),
                getLongOrNull(rs, "playtime_mac_forever"),
                getLongOrNull(rs, "playtime_linux_forever"),
                getLongOrNull(rs, "playtime_deck_forever"),
                getLongOrNull(rs, "playtime_2weeks"),
                getLongOrNull(rs, "playtime_disconnected"),
                getLongOrNull(rs, "rtime_last_played")
        );
    }

    private LegacyGame.GogData mapGogData(ResultSet rs) throws SQLException {
        return new LegacyGame.GogData(
                rs.getString("backgroundImage"),
                rs.getString("coverVertical"),
                rs.getString("coverHorizontal"),
                rs.getString("cdKey"),
                rs.getString("textInformation"),
                rs.getString("downloads"),
                rs.getString("galaxyDownloads"),
                rs.getString("extras"),
                rs.getString("dlcs"),
                rs.getString("tags"),
                rs.getString("features"),
                rs.getString("isPreOrder"),
                getLongOrNull(rs, "releaseTimestamp"),
                rs.getString("messages"),
                rs.getString("changelog"),
                rs.getString("forumLink"),
                rs.getString("storeLink"),
                rs.getString("isBaseProductMissing"),
                rs.getString("missingBaseProduct"),
                rs.getString("simpleGalaxyInstallers"),
                getLongOrNull(rs, "reviewsRating")
        );
    }

    private LegacyGame.Ratings mapRatings(ResultSet rs) throws SQLException {
        return new LegacyGame.Ratings(
                getLongOrNull(rs, "metacritic_score"),
                rs.getString("metacritic_game_name"),
                getDoubleOrNull(rs, "mc_hltb_ratio")
        );
    }

    private LegacyGame.HltbData mapHltbData(ResultSet rs) throws SQLException {
        return new LegacyGame.HltbData(
                getDoubleOrNull(rs, "hltb_main_story"),
                getLongOrNull(rs, "hltb_main_extra"),
                getLongOrNull(rs, "hltb_completionist"),
                getLongOrNull(rs, "hltb_game_id"),
                getLongOrNull(rs, "hltb_similarity")
        );
    }

    private LegacyGame.UserState mapUserState(ResultSet rs) throws SQLException {
        return new LegacyGame.UserState(
                parseStringBoolean(rs, "played"),
                parseStringBoolean(rs, "hide"),
                parseStringBoolean(rs, "later")
        );
    }

    private Long getLongOrNull(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private Float getFloatOrNull(ResultSet rs, String column) throws SQLException {
        float value = rs.getFloat(column);
        return rs.wasNull() ? null : value;
    }

    private Double getDoubleOrNull(ResultSet rs, String column) throws SQLException {
        double value = rs.getDouble(column);
        return rs.wasNull() ? null : value;
    }

    private boolean parseStringBoolean(ResultSet rs, String column) throws SQLException {
        return Boolean.parseBoolean(rs.getString(column));
    }
}

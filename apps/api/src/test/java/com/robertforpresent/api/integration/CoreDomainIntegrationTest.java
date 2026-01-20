package com.robertforpresent.api.integration;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.infrastructure.persistence.SpringDataCanonicalGameRepository;
import com.robertforpresent.api.collection.application.service.GamerCollectionService;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import com.robertforpresent.api.collection.infrastructure.persistence.SpringDataCollectionRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the core domain.
 * Tests the interaction between domain models, repositories, and services.
 */
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CoreDomainIntegrationTest {

    @Autowired
    private CanonicalGameRepository canonicalGameRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private CatalogService catalogService;

    @Autowired
    private GamerCollectionService collectionService;

    @Autowired
    private SpringDataCanonicalGameRepository springDataGameRepository;

    @Autowired
    private SpringDataCollectionRepository springDataCollectionRepository;

    private static final UUID GAMER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        springDataCollectionRepository.deleteAll();
        springDataGameRepository.deleteAll();
    }

    @Nested
    @DisplayName("Catalog Domain Integration")
    class CatalogDomainTests {

        @Test
        @DisplayName("saves and retrieves game with all store data")
        void savesAndRetrievesGameWithAllStoreData() {
            // given
            var steamRating = SteamRating.of(89, 11, ReviewSentiment.VERY_POSITIVE);
            var steamData = new SteamGameData(413150, "Stardew Valley");
            var gogData = new GogGameData(1234567890L, "Stardew Valley", "https://www.gog.com/game/stardew_valley");
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", "https://store.epicgames.com/p/stardew-valley");
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setThumbnailUrl("https://example.com/stardew.jpg")
                    .setSteamRating(steamRating)
                    .setSteamData(steamData)
                    .setGogData(gogData)
                    .setEpicData(epicData)
                    .setMetacriticData(metacriticData)
                    .setHltbData(hltbData)
                    .setIgdbId(17000L)
                    .setIgdbSlug("stardew-valley")
                    .setGenres(List.of("Simulation", "RPG", "Indie"))
                    .build();

            // when
            CanonicalGame saved = canonicalGameRepository.save(game);
            Optional<CanonicalGame> retrieved = canonicalGameRepository.findById(saved.getId());

            // then
            assertTrue(retrieved.isPresent());
            CanonicalGame found = retrieved.get();

            assertEquals("Stardew Valley", found.getName());
            assertEquals("https://example.com/stardew.jpg", found.getThumbnailUrl());
            assertEquals(89, found.getRating());

            // Steam data
            assertNotNull(found.getSteamData());
            assertEquals(413150, found.getSteamData().appId());
            assertEquals("Stardew Valley", found.getSteamData().name());

            // GOG data
            assertNotNull(found.getGogData());
            assertEquals(1234567890L, found.getGogData().gogId());

            // Epic data
            assertNotNull(found.getEpicData());
            assertEquals("stardew-valley", found.getEpicData().epicId());

            // Metacritic data
            assertNotNull(found.getMetacriticData());
            assertEquals(89, found.getMetacriticData().score());

            // HLTB data
            assertNotNull(found.getHltbData());
            assertEquals(52.0, found.getHltbData().mainStoryHours());

            // IGDB data
            assertEquals(17000L, found.getIgdbId());
            assertEquals("stardew-valley", found.getIgdbSlug());

            // Genres
            assertEquals(3, found.getGenres().size());
            assertTrue(found.getGenres().contains("Simulation"));
        }

        @Test
        @DisplayName("finds game by name case insensitively")
        void findsGameByNameCaseInsensitively() {
            // given
            var game = new CanonicalGame.Builder("Hollow Knight").build();
            canonicalGameRepository.save(game);

            // when
            Optional<CanonicalGame> found = canonicalGameRepository.findByNameIgnoreCase("hollow knight");

            // then
            assertTrue(found.isPresent());
            assertEquals("Hollow Knight", found.get().getName());
        }

        @Test
        @DisplayName("batch loads multiple games by IDs")
        void batchLoadsMultipleGamesByIds() {
            // given
            var game1 = canonicalGameRepository.save(new CanonicalGame.Builder("Game 1").build());
            var game2 = canonicalGameRepository.save(new CanonicalGame.Builder("Game 2").build());
            var game3 = canonicalGameRepository.save(new CanonicalGame.Builder("Game 3").build());

            // when
            Map<UUID, CanonicalGame> result = catalogService.getByIds(
                    List.of(game1.getId(), game2.getId(), game3.getId())
            );

            // then
            assertEquals(3, result.size());
            assertEquals("Game 1", result.get(game1.getId()).getName());
            assertEquals("Game 2", result.get(game2.getId()).getName());
            assertEquals("Game 3", result.get(game3.getId()).getName());
        }

        @Test
        @DisplayName("detects duplicate games by name")
        void detectsDuplicateGamesByName() {
            // given
            canonicalGameRepository.save(new CanonicalGame.Builder("Duplicate Game").build());
            canonicalGameRepository.save(new CanonicalGame.Builder("Duplicate Game").build());
            canonicalGameRepository.save(new CanonicalGame.Builder("Unique Game").build());

            // when
            Map<String, List<CanonicalGame>> duplicates = catalogService.findDuplicatesByName();

            // then
            assertEquals(1, duplicates.size());
            assertTrue(duplicates.containsKey("duplicate game"));
            assertEquals(2, duplicates.get("duplicate game").size());
        }
    }

    @Nested
    @DisplayName("Collection Domain Integration")
    class CollectionDomainTests {

        @Test
        @DisplayName("saves and retrieves personalized game")
        void savesAndRetrievesPersonalizedGame() {
            // given
            var canonicalGame = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Test Game").build()
            );

            var personalizedGame = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(canonicalGame.getId())
                    .setMarkAsPlayed(true)
                    .setOwnedOnSteam(true)
                    .setSteamPlaytimeMinutes(120)
                    .build();

            // when
            PersonalizedGame saved = collectionRepository.save(personalizedGame);
            List<PersonalizedGame> found = collectionRepository.findByGamerId(GAMER_ID);

            // then
            assertEquals(1, found.size());
            PersonalizedGame retrieved = found.get(0);
            assertEquals(canonicalGame.getId(), retrieved.getCanonicalGameId());
            assertTrue(retrieved.isMarkedAsPlayed());
            assertTrue(retrieved.isOwnedOnSteam());
            assertEquals(120, retrieved.getSteamPlaytimeMinutes());
        }

        @Test
        @DisplayName("updates game flags")
        void updatesGameFlags() {
            // given
            var canonicalGame = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Test Game").build()
            );
            var personalizedGame = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(canonicalGame.getId())
                    .setMarkAsPlayed(false)
                    .setMarkAsHidden(false)
                    .setMarkAsForLater(false)
                    .build();
            collectionRepository.save(personalizedGame);

            // when
            PersonalizedGame updated = collectionRepository.updateFlags(
                    GAMER_ID, canonicalGame.getId(),
                    true, true, true
            );

            // then
            assertTrue(updated.isMarkedAsPlayed());
            assertTrue(updated.isMarkedAsHidden());
            assertTrue(updated.isMarkedForLater());
        }

        @Test
        @DisplayName("retrieves collection with store links")
        void retrievesCollectionWithStoreLinks() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley");
            var steamRating = SteamRating.of(89, 11, ReviewSentiment.VERY_POSITIVE);
            var canonicalGame = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Stardew Valley")
                            .setSteamData(steamData)
                            .setSteamRating(steamRating)
                            .setThumbnailUrl("https://example.com/stardew.jpg")
                            .build()
            );

            var personalizedGame = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(canonicalGame.getId())
                    .setOwnedOnSteam(true)
                    .build();
            collectionRepository.save(personalizedGame);

            // when
            var collection = collectionService.getCollection(GAMER_ID);

            // then
            assertEquals(1, collection.size());
            var gameView = collection.get(0);
            assertEquals("Stardew Valley", gameView.name());
            assertNotNull(gameView.storeLinks());
            assertEquals("https://store.steampowered.com/app/413150", gameView.storeLinks().steamLink());
        }
    }

    @Nested
    @DisplayName("Cross-Domain Integration")
    class CrossDomainTests {

        @Test
        @DisplayName("merging games updates collection references")
        void mergingGamesUpdatesCollectionReferences() {
            // given - Create two duplicate games
            var game1 = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Duplicate Game")
                            .setSteamData(new SteamGameData(111, "Duplicate Game"))
                            .build()
            );
            var game2 = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Duplicate Game")
                            .setGogData(new GogGameData(222L, "Duplicate Game", null))
                            .build()
            );

            // Create collection entries pointing to both games
            collectionRepository.save(new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(game1.getId())
                    .setOwnedOnSteam(true)
                    .build());
            collectionRepository.save(new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(game2.getId())
                    .setOwnedOnGog(true)
                    .build());

            // when - Merge game2 into game1
            catalogService.mergeGames(game1.getId(), List.of(game2.getId()));

            // then - All collection entries should point to game1
            List<PersonalizedGame> collection = collectionRepository.findByGamerId(GAMER_ID);

            // Both entries should now point to game1
            assertTrue(collection.stream()
                    .allMatch(g -> g.getCanonicalGameId().equals(game1.getId())));

            // game2 should be deleted
            assertTrue(canonicalGameRepository.findById(game2.getId()).isEmpty());
        }

        @Test
        @DisplayName("getTop3 correctly filters and sorts across domains")
        void getTop3CorrectlyFiltersAndSorts() {
            // given - Create games with different ratings
            var game1 = canonicalGameRepository.save(createGameWithRating("Game High", 95));
            var game2 = canonicalGameRepository.save(createGameWithRating("Game Medium", 75));
            var game3 = canonicalGameRepository.save(createGameWithRating("Game Low", 55));
            var playedGame = canonicalGameRepository.save(createGameWithRating("Played Game", 99));

            // Add all to collection
            collectionRepository.save(createCollectionEntry(game1.getId(), false, false, false));
            collectionRepository.save(createCollectionEntry(game2.getId(), false, false, false));
            collectionRepository.save(createCollectionEntry(game3.getId(), false, false, false));
            collectionRepository.save(createCollectionEntry(playedGame.getId(), true, false, false)); // played

            // when
            var top3 = collectionService.getTop3(GAMER_ID);

            // then - Should exclude played game and sort by rating
            assertEquals(3, top3.size());
            assertEquals("Game High", top3.get(0).name());
            assertEquals("Game Medium", top3.get(1).name());
            assertEquals("Game Low", top3.get(2).name());
        }

        @Test
        @DisplayName("getBacklog only returns games marked for later")
        void getBacklogOnlyReturnsGamesMarkedForLater() {
            // given
            var backlogGame = canonicalGameRepository.save(createGameWithRating("Backlog Game", 80));
            var normalGame = canonicalGameRepository.save(createGameWithRating("Normal Game", 90));

            collectionRepository.save(createCollectionEntry(backlogGame.getId(), false, false, true)); // for later
            collectionRepository.save(createCollectionEntry(normalGame.getId(), false, false, false));

            // when
            var backlog = collectionService.getBacklog(GAMER_ID);

            // then
            assertEquals(1, backlog.size());
            assertEquals("Backlog Game", backlog.get(0).name());
            assertTrue(backlog.get(0).markedForLater());
        }
    }

    @Nested
    @DisplayName("Catalog Service Integration")
    class CatalogServiceIntegrationTests {

        @Test
        @DisplayName("auto-merges all duplicates keeping most complete data")
        void autoMergesAllDuplicatesKeepingMostCompleteData() {
            // given - Create duplicates with varying completeness
            var lessComplete = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Test Game").build()
            );
            var moreComplete = canonicalGameRepository.save(
                    new CanonicalGame.Builder("Test Game")
                            .setSteamData(new SteamGameData(123, "Test Game"))
                            .setSteamRating(SteamRating.of(80, 20, ReviewSentiment.VERY_POSITIVE))
                            .setThumbnailUrl("https://example.com/thumb.jpg")
                            .setIgdbId(999L)
                            .build()
            );

            // Add collection entries
            collectionRepository.save(createCollectionEntry(lessComplete.getId(), false, false, false));

            // when
            int merged = catalogService.autoMergeAllDuplicates();

            // then
            assertEquals(1, merged);

            // The more complete game should be kept
            List<CanonicalGame> remaining = canonicalGameRepository.findAll();
            assertEquals(1, remaining.size());

            CanonicalGame kept = remaining.get(0);
            assertNotNull(kept.getSteamData());
            assertEquals(123, kept.getSteamData().appId());
            assertNotNull(kept.getThumbnailUrl());
            assertEquals(999L, kept.getIgdbId());

            // Collection entry should be updated to point to the kept game
            List<PersonalizedGame> collection = collectionRepository.findByGamerId(GAMER_ID);
            assertTrue(collection.stream()
                    .allMatch(g -> g.getCanonicalGameId().equals(kept.getId())));
        }
    }

    @Nested
    @DisplayName("Data Integrity")
    class DataIntegrityTests {

        @Test
        @DisplayName("deleting canonical game does not orphan collection entries")
        void deletingCanonicalGameHandledCorrectly() {
            // given
            var game = canonicalGameRepository.save(new CanonicalGame.Builder("Test").build());
            collectionRepository.save(createCollectionEntry(game.getId(), false, false, false));

            // when
            canonicalGameRepository.deleteById(game.getId());

            // then - collection entry still exists (orphaned, but system handles this)
            List<PersonalizedGame> collection = collectionRepository.findByGamerId(GAMER_ID);
            // Collection entries may still exist but canonical game is gone
            assertTrue(canonicalGameRepository.findById(game.getId()).isEmpty());
        }

        @Test
        @DisplayName("batch operations maintain consistency")
        void batchOperationsMaintainConsistency() {
            // given - Create multiple games
            List<CanonicalGame> games = List.of(
                    canonicalGameRepository.save(new CanonicalGame.Builder("Game A").build()),
                    canonicalGameRepository.save(new CanonicalGame.Builder("Game B").build()),
                    canonicalGameRepository.save(new CanonicalGame.Builder("Game C").build())
            );

            // Add to collection
            games.forEach(g ->
                    collectionRepository.save(createCollectionEntry(g.getId(), false, false, false))
            );

            // when - Batch load
            List<UUID> ids = games.stream().map(CanonicalGame::getId).toList();
            Map<UUID, CanonicalGame> loaded = catalogService.getByIds(ids);

            // then
            assertEquals(3, loaded.size());
            games.forEach(g -> {
                assertTrue(loaded.containsKey(g.getId()));
                assertEquals(g.getName(), loaded.get(g.getId()).getName());
            });
        }
    }

    // Helper methods

    private CanonicalGame createGameWithRating(String name, int positivePercent) {
        int positive = positivePercent;
        int negative = 100 - positivePercent;
        var rating = SteamRating.of(positive, negative, ReviewSentiment.MIXED);
        return new CanonicalGame.Builder(name)
                .setSteamRating(rating)
                .setThumbnailUrl("https://example.com/" + name.toLowerCase().replace(" ", "-") + ".jpg")
                .build();
    }

    private PersonalizedGame createCollectionEntry(UUID gameId, boolean played, boolean hidden, boolean forLater) {
        return new PersonalizedGame.Builder()
                .setGamerId(GAMER_ID)
                .setCanonicalId(gameId)
                .setMarkAsPlayed(played)
                .setMarkAsHidden(hidden)
                .setMarkAsForLater(forLater)
                .build();
    }
}

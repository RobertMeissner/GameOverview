package com.robertforpresent.api.collection.application.service;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.MetacriticGameData;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.collection.application.dto.AdminGameView;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GamerCollectionService.
 */
@ExtendWith(MockitoExtension.class)
class GamerCollectionServiceTest {

    @Mock
    private CollectionRepository repository;

    @Mock
    private CatalogService catalogService;

    private GamerCollectionService service;

    private static final UUID GAMER_ID = UUID.randomUUID();
    private static final UUID GAME_ID_1 = UUID.randomUUID();
    private static final UUID GAME_ID_2 = UUID.randomUUID();
    private static final UUID GAME_ID_3 = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new GamerCollectionService(repository, catalogService);
    }

    @Nested
    @DisplayName("getTop3()")
    class GetTop3Tests {

        @Test
        @DisplayName("filters out played games from top 3")
        void filtersOutPlayedGames() {
            // given
            var playedGame = createPersonalizedGame(GAME_ID_1, true, false, false);
            var unplayedGame = createPersonalizedGame(GAME_ID_2, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(playedGame, unplayedGame));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Played Game", 0.95f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Unplayed Game", 0.80f)
            ));

            // when
            var top3 = service.getTop3(GAMER_ID);

            // then
            assertEquals(1, top3.size());
            assertEquals("Unplayed Game", top3.get(0).name());
        }

        @Test
        @DisplayName("filters out hidden games from top 3")
        void filtersOutHiddenGames() {
            // given
            var hiddenGame = createPersonalizedGame(GAME_ID_1, false, true, false);
            var visibleGame = createPersonalizedGame(GAME_ID_2, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(hiddenGame, visibleGame));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Hidden Game", 0.95f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Visible Game", 0.80f)
            ));

            // when
            var top3 = service.getTop3(GAMER_ID);

            // then
            assertEquals(1, top3.size());
            assertEquals("Visible Game", top3.get(0).name());
        }

        @Test
        @DisplayName("filters out games marked for later from top 3")
        void filtersOutMarkedForLaterGames() {
            // given
            var laterGame = createPersonalizedGame(GAME_ID_1, false, false, true);
            var normalGame = createPersonalizedGame(GAME_ID_2, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(laterGame, normalGame));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Later Game", 0.95f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Normal Game", 0.80f)
            ));

            // when
            var top3 = service.getTop3(GAMER_ID);

            // then
            assertEquals(1, top3.size());
            assertEquals("Normal Game", top3.get(0).name());
        }

        @Test
        @DisplayName("sorts by rating descending and limits to 3")
        void sortsByRatingAndLimitsTo3() {
            // given
            UUID gameId4 = UUID.randomUUID();
            var game1 = createPersonalizedGame(GAME_ID_1, false, false, false);
            var game2 = createPersonalizedGame(GAME_ID_2, false, false, false);
            var game3 = createPersonalizedGame(GAME_ID_3, false, false, false);
            var game4 = createPersonalizedGame(gameId4, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game1, game2, game3, game4));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2, GAME_ID_3, gameId4))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Game 1", 0.70f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Game 2", 0.90f),
                    GAME_ID_3, createCanonicalGame(GAME_ID_3, "Game 3", 0.80f),
                    gameId4, createCanonicalGame(gameId4, "Game 4", 0.60f)
            ));

            // when
            var top3 = service.getTop3(GAMER_ID);

            // then
            assertEquals(3, top3.size());
            assertEquals("Game 2", top3.get(0).name()); // 0.90
            assertEquals("Game 3", top3.get(1).name()); // 0.80
            assertEquals("Game 1", top3.get(2).name()); // 0.70
        }
    }

    @Nested
    @DisplayName("getBacklog()")
    class GetBacklogTests {

        @Test
        @DisplayName("returns only games marked for later")
        void returnsOnlyGamesMarkedForLater() {
            // given
            var laterGame = createPersonalizedGame(GAME_ID_1, false, false, true);
            var normalGame = createPersonalizedGame(GAME_ID_2, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(laterGame, normalGame));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Later Game", 0.80f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Normal Game", 0.90f)
            ));

            // when
            var backlog = service.getBacklog(GAMER_ID);

            // then
            assertEquals(1, backlog.size());
            assertEquals("Later Game", backlog.get(0).name());
            assertTrue(backlog.get(0).markedForLater());
        }

        @Test
        @DisplayName("sorts backlog by rating descending")
        void sortsBacklogByRatingDescending() {
            // given
            var game1 = createPersonalizedGame(GAME_ID_1, false, false, true);
            var game2 = createPersonalizedGame(GAME_ID_2, false, false, true);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game1, game2));
            when(catalogService.getByIds(List.of(GAME_ID_1, GAME_ID_2))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Lower Rated", 0.70f),
                    GAME_ID_2, createCanonicalGame(GAME_ID_2, "Higher Rated", 0.90f)
            ));

            // when
            var backlog = service.getBacklog(GAMER_ID);

            // then
            assertEquals(2, backlog.size());
            assertEquals("Higher Rated", backlog.get(0).name());
            assertEquals("Lower Rated", backlog.get(1).name());
        }

        @Test
        @DisplayName("returns empty list when no games marked for later")
        void returnsEmptyListWhenNoGamesMarkedForLater() {
            // given
            var normalGame = createPersonalizedGame(GAME_ID_1, false, false, false);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(normalGame));
            when(catalogService.getByIds(List.of(GAME_ID_1))).thenReturn(Map.of(
                    GAME_ID_1, createCanonicalGame(GAME_ID_1, "Normal Game", 0.80f)
            ));

            // when
            var backlog = service.getBacklog(GAMER_ID);

            // then
            assertTrue(backlog.isEmpty());
        }
    }

    @Nested
    @DisplayName("getAdminCollection()")
    class GetAdminCollectionTests {

        @Test
        @DisplayName("includes all store data in admin view")
        void includesAllStoreDataInAdminView() {
            // given
            var game = createPersonalizedGame(GAME_ID_1, false, false, false);
            var canonical = createCanonicalGameWithStoreData(
                    GAME_ID_1,
                    "Test Game",
                    0.85f,
                    new SteamGameData(413150, "Test Game Steam"),
                    new GogGameData(123456L, "Test Game GOG", "https://www.gog.com/game/test"),
                    new MetacriticGameData(89, "Test Game", null)
            );

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game));
            when(catalogService.getByIds(List.of(GAME_ID_1))).thenReturn(Map.of(GAME_ID_1, canonical));

            // when
            List<AdminGameView> adminGames = service.getAdminCollection(GAMER_ID);

            // then
            assertEquals(1, adminGames.size());
            var adminView = adminGames.get(0);

            // Verify Steam data
            assertEquals(413150, adminView.steamAppId());
            assertEquals("Test Game Steam", adminView.steamName());
            assertEquals("https://store.steampowered.com/app/413150", adminView.steamLink());

            // Verify GOG data
            assertEquals(123456L, adminView.gogId());
            assertEquals("Test Game GOG", adminView.gogName());
            assertEquals("https://www.gog.com/game/test", adminView.gogLink());

            // Verify Metacritic data
            assertEquals(89, adminView.metacriticScore());
            assertEquals("Test Game", adminView.metacriticName());
            assertEquals("https://www.metacritic.com/game/test-game", adminView.metacriticLink());
        }

        @Test
        @DisplayName("handles null store data gracefully")
        void handlesNullStoreDataGracefully() {
            // given
            var game = createPersonalizedGame(GAME_ID_1, false, false, false);
            var canonical = createCanonicalGame(GAME_ID_1, "Test Game", 0.85f);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game));
            when(catalogService.getByIds(List.of(GAME_ID_1))).thenReturn(Map.of(GAME_ID_1, canonical));

            // when
            List<AdminGameView> adminGames = service.getAdminCollection(GAMER_ID);

            // then
            assertEquals(1, adminGames.size());
            var adminView = adminGames.get(0);

            assertNull(adminView.steamAppId());
            assertNull(adminView.steamName());
            assertNull(adminView.steamLink());
            assertNull(adminView.gogId());
            assertNull(adminView.gogName());
            assertNull(adminView.gogLink());
            assertNull(adminView.metacriticScore());
            assertNull(adminView.metacriticName());
            assertNull(adminView.metacriticLink());
        }
    }

    @Nested
    @DisplayName("store links in collection view")
    class StoreLinksTests {

        @Test
        @DisplayName("includes store links in collection view")
        void includesStoreLinksInCollectionView() {
            // given
            var game = createPersonalizedGame(GAME_ID_1, false, false, false);
            var canonical = createCanonicalGameWithStoreData(
                    GAME_ID_1,
                    "Test Game",
                    0.85f,
                    new SteamGameData(413150, "Test Game"),
                    new GogGameData(123456L, "Test Game", "https://www.gog.com/game/test"),
                    null
            );

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game));
            when(catalogService.getByIds(List.of(GAME_ID_1))).thenReturn(Map.of(GAME_ID_1, canonical));

            // when
            var collection = service.getCollection(GAMER_ID);

            // then
            assertEquals(1, collection.size());
            var storeLinks = collection.get(0).storeLinks();
            assertNotNull(storeLinks);
            assertEquals("https://store.steampowered.com/app/413150", storeLinks.steamLink());
            assertEquals("https://www.gog.com/game/test", storeLinks.gogLink());
            assertNull(storeLinks.metacriticLink());
        }

        @Test
        @DisplayName("handles all null store data for store links")
        void handlesAllNullStoreDataForStoreLinks() {
            // given
            var game = createPersonalizedGame(GAME_ID_1, false, false, false);
            var canonical = createCanonicalGame(GAME_ID_1, "Test Game", 0.85f);

            when(repository.findByGamerId(GAMER_ID)).thenReturn(List.of(game));
            when(catalogService.getByIds(List.of(GAME_ID_1))).thenReturn(Map.of(GAME_ID_1, canonical));

            // when
            var collection = service.getCollection(GAMER_ID);

            // then
            var storeLinks = collection.get(0).storeLinks();
            assertNotNull(storeLinks);
            assertNull(storeLinks.steamLink());
            assertNull(storeLinks.gogLink());
            assertNull(storeLinks.metacriticLink());
        }
    }

    // Helper methods

    private PersonalizedGame createPersonalizedGame(UUID gameId, boolean played, boolean hidden, boolean later) {
        return new PersonalizedGame.Builder().setGamerId(GAMER_ID).setCanonicalId(gameId).setMarkAsPlayed(played).setMarkAsHidden(hidden).setMarkAsForLater(later).build();
    }

    private CanonicalGame createCanonicalGame(UUID id, String name, float rating) {
        SteamRating steamRating = SteamRating.of((int) (rating * 100), (int) ((1 - rating) * 100), ReviewSentiment.MIXED);
        return new CanonicalGame.Builder(name)
                .setId(id)
                .setSteamRating(steamRating)
                .setThumbnailUrl("https://example.com/" + id + ".jpg")
                .build();
    }

    private CanonicalGame createCanonicalGameWithStoreData(
            UUID id, String name, float rating,
            SteamGameData steamData, GogGameData gogData, MetacriticGameData metacriticData) {
        SteamRating steamRating = SteamRating.of((int) (rating * 100), (int) ((1 - rating) * 100), ReviewSentiment.MIXED);
        return new CanonicalGame.Builder(name)
                .setId(id)
                .setSteamRating(steamRating)
                .setThumbnailUrl("https://example.com/" + id + ".jpg")
                .setSteamData(steamData)
                .setGogData(gogData)
                .setMetacriticData(metacriticData)
                .build();
    }
}

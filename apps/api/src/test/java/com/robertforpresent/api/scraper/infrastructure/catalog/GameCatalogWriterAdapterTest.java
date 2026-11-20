package com.robertforpresent.api.scraper.infrastructure.catalog;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameCatalogWriterAdapterTest {

    @Mock
    private CanonicalGameRepository catalogRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private CatalogLookup catalogLookup;

    private GameCatalogWriterAdapter adapter;

    private final UUID gamerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        adapter = new GameCatalogWriterAdapter(catalogRepository, collectionRepository, catalogLookup);
    }

    private ScrapedGameInfo igdbGame(long igdbId, String name, String slug, Double rating) {
        return new ScrapedGameInfo(
                igdbId,
                name,
                slug,
                null,
                "https://cover.example/t_cover_big/x.jpg",
                rating,
                2020,
                List.of("RPG"),
                List.of(),
                List.of(
                        new ScrapedGameInfo.StoreLink("Steam", "https://store.steampowered.com/app/1091500/", "1091500"),
                        new ScrapedGameInfo.StoreLink("GOG", "https://www.gog.com/game/" + slug, null)
                ),
                null,
                "igdb"
        );
    }

    @Test
    @DisplayName("creating a game from an IGDB scrape stores IGDB id, slug, rating, genres and store ids")
    void creatingGameStoresIgdbAndStoreIds() {
        when(catalogLookup.findMatch(any())).thenReturn(Optional.empty());
        when(catalogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(collectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adapter.addGameToLibrary(igdbGame(1091500L, "Cyberpunk 2077", "cyberpunk-2077", 86.0), gamerId);

        ArgumentCaptor<CanonicalGame> captor = ArgumentCaptor.forClass(CanonicalGame.class);
        org.mockito.Mockito.verify(catalogRepository).save(captor.capture());
        CanonicalGame saved = captor.getValue();

        assertEquals(1091500L, saved.getIgdbId());
        assertEquals("cyberpunk-2077", saved.getIgdbSlug());
        assertEquals(86.0, saved.getRatings().igdb());
        assertEquals(List.of("RPG"), saved.getGenres());
        assertNotNull(saved.getSteamData());
        assertEquals(1091500, saved.getSteamData().appId());
        assertNotNull(saved.getGogData());
        assertEquals("https://www.gog.com/game/cyberpunk-2077", saved.getGogData().link());
    }

    @Test
    @DisplayName("adding a scraped game that already exists fills in the missing IGDB and store ids")
    void existingGameGetsMissingIdsFilled() {
        UUID existingId = UUID.randomUUID();
        CanonicalGame existing = new CanonicalGame.Builder("Cyberpunk 2077")
                .setId(existingId)
                .setSteamData(new SteamGameData(1234, "Cyberpunk 2077"))
                .build();

        when(catalogLookup.findMatch(any())).thenReturn(
                Optional.of(new CatalogLookup.CatalogMatch(existingId, "steam-app-id")));
        when(catalogRepository.findById(existingId)).thenReturn(Optional.of(existing));
        when(catalogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(collectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adapter.addGameToLibrary(igdbGame(1091500L, "Cyberpunk 2077", "cyberpunk-2077", 86.0), gamerId);

        ArgumentCaptor<CanonicalGame> captor = ArgumentCaptor.forClass(CanonicalGame.class);
        org.mockito.Mockito.verify(catalogRepository).save(captor.capture());
        CanonicalGame merged = captor.getValue();

        assertEquals(existingId, merged.getId());
        assertEquals(1091500L, merged.getIgdbId());
        assertEquals("cyberpunk-2077", merged.getIgdbSlug());
        assertEquals(86.0, merged.getRatings().igdb());
        assertEquals(List.of("RPG"), merged.getGenres());
        assertEquals(1234, merged.getSteamData().appId());
        assertEquals("https://www.gog.com/game/cyberpunk-2077", merged.getGogData().link());
    }

    @Test
    @DisplayName("a Steam-sourced scrape does not store the Steam App ID as IGDB id")
    void steamSourceDoesNotSetIgdbId() {
        when(catalogLookup.findMatch(any())).thenReturn(Optional.empty());
        when(catalogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(collectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ScrapedGameInfo steamGame = new ScrapedGameInfo(
                1091500,
                "Cyberpunk 2077",
                null,
                null,
                "https://header.example/x.jpg",
                86.0,
                2020,
                List.of("RPG"),
                List.of(),
                List.of(new ScrapedGameInfo.StoreLink("Steam",
                        "https://store.steampowered.com/app/1091500/", "1091500")),
                null,
                "steam"
        );

        adapter.addGameToLibrary(steamGame, gamerId);

        ArgumentCaptor<CanonicalGame> captor = ArgumentCaptor.forClass(CanonicalGame.class);
        org.mockito.Mockito.verify(catalogRepository).save(captor.capture());
        CanonicalGame saved = captor.getValue();

        assertNull(saved.getIgdbId());
        assertNull(saved.getIgdbSlug());
        assertEquals(1091500, saved.getSteamData().appId());
        assertTrue(saved.getGenres().contains("RPG"));
    }
}

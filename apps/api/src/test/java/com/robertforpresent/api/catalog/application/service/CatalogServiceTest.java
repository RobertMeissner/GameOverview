package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameCollectionPort;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.thumbnail.application.service.ThumbnailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {
    @Mock
    private CanonicalGameRepository repository;

    @Mock
    private GameCollectionPort collectionPort;

    @Mock
    private GameScraperService scraperService;

    @Mock
    private ThumbnailService thumbnailService;

    private CatalogService service;

    @BeforeEach
    void setUp() {
        service = new CatalogService(repository, collectionPort, scraperService, thumbnailService);
    }

    @Test
    void testGetAllGames() {
        List<CanonicalGame> expected = List.of(new CanonicalGame.Builder("Stardew Valley").build());
        when(repository.findAll()).thenReturn(expected);
        assertEquals(1, service.getAllGames().size());
    }

    @Nested
    @DisplayName("getByIds()")
    class GetByIdsTests {

        @Test
        @DisplayName("returns empty map when given empty list")
        void returnsEmptyMapForEmptyList() {
            Map<UUID, CanonicalGame> result = service.getByIds(List.of());
            assertTrue(result.isEmpty());
            verify(repository, never()).findAllByIds(any());
        }

        @Test
        @DisplayName("returns map of games indexed by ID")
        void returnsMapOfGamesIndexedById() {
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();
            CanonicalGame game1 = new CanonicalGame.Builder("Game 1").setId(id1).build();
            CanonicalGame game2 = new CanonicalGame.Builder("Game 2").setId(id2).build();

            when(repository.findAllByIds(List.of(id1, id2))).thenReturn(List.of(game1, game2));

            Map<UUID, CanonicalGame> result = service.getByIds(List.of(id1, id2));

            assertEquals(2, result.size());
            assertEquals("Game 1", result.get(id1).getName());
            assertEquals("Game 2", result.get(id2).getName());
        }

        @Test
        @DisplayName("calls repository only once for batch loading")
        void callsRepositoryOnlyOnce() {
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();
            UUID id3 = UUID.randomUUID();

            when(repository.findAllByIds(any())).thenReturn(List.of(
                    new CanonicalGame.Builder("Game 1").setId(id1).build(),
                    new CanonicalGame.Builder("Game 2").setId(id2).build(),
                    new CanonicalGame.Builder("Game 3").setId(id3).build()
            ));

            service.getByIds(List.of(id1, id2, id3));

            verify(repository, times(1)).findAllByIds(any());
        }
    }

    @Nested
    @DisplayName("findByName()")
    class FindByNameTests {

        @Test
        @DisplayName("returns game when found by exact name (case insensitive)")
        void returnsGameWhenFoundByName() {
            CanonicalGame game = new CanonicalGame.Builder("Stardew Valley").build();
            when(repository.findByNameIgnoreCase("stardew valley")).thenReturn(Optional.of(game));

            Optional<CanonicalGame> result = service.findByName("stardew valley");

            assertTrue(result.isPresent());
            assertEquals("Stardew Valley", result.get().getName());
        }

        @Test
        @DisplayName("returns empty when game not found")
        void returnsEmptyWhenNotFound() {
            when(repository.findByNameIgnoreCase("NonExistent Game")).thenReturn(Optional.empty());

            Optional<CanonicalGame> result = service.findByName("NonExistent Game");

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("uses database query instead of full table scan")
        void usesDatabaseQueryNotFullTableScan() {
            when(repository.findByNameIgnoreCase("Test Game")).thenReturn(Optional.empty());

            service.findByName("Test Game");

            verify(repository, times(1)).findByNameIgnoreCase("Test Game");
            verify(repository, never()).findAll();
        }
    }

    @Nested
    @DisplayName("mergeGames()")
    class MergeGamesTests {

        @Test
        @DisplayName("updates references and deletes source games")
        void updatesReferencesAndDeletesSourceGames() {
            UUID targetId = UUID.randomUUID();
            UUID sourceId1 = UUID.randomUUID();
            UUID sourceId2 = UUID.randomUUID();

            CanonicalGame target = new CanonicalGame.Builder("Target Game").setId(targetId).build();
            CanonicalGame source1 = new CanonicalGame.Builder("Source 1").setId(sourceId1).build();
            CanonicalGame source2 = new CanonicalGame.Builder("Source 2").setId(sourceId2).build();

            when(repository.findById(targetId)).thenReturn(Optional.of(target));
            when(repository.findById(sourceId1)).thenReturn(Optional.of(source1));
            when(repository.findById(sourceId2)).thenReturn(Optional.of(source2));

            service.mergeGames(targetId, List.of(sourceId1, sourceId2));

            verify(collectionPort).updateCanonicalGameReferences(sourceId1, targetId);
            verify(collectionPort).updateCanonicalGameReferences(sourceId2, targetId);
            verify(repository).deleteById(sourceId1);
            verify(repository).deleteById(sourceId2);
        }

        @Test
        @DisplayName("throws when target game not found")
        void throwsWhenTargetNotFound() {
            UUID targetId = UUID.randomUUID();
            when(repository.findById(targetId)).thenReturn(Optional.empty());

            assertThrows(Exception.class, () ->
                    service.mergeGames(targetId, List.of(UUID.randomUUID()))
            );
        }
    }
}

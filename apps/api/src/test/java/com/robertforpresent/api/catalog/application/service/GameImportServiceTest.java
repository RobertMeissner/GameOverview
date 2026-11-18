package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.application.command.ImportGameCommand;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameCollectionPort;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.application.service.GameImportService.SingleImportResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameImportServiceTest {

    @Mock
    private CanonicalGameRepository gameRepository;

    @Mock
    private GameCollectionPort collectionPort;

    private GameImportService service;

    @BeforeEach
    void setUp() {
        service = new GameImportService(gameRepository, collectionPort);
    }

    @Test
    @DisplayName("importSingleGame with null store does not throw and still creates the game")
    void importSingleGame_withNullStore_createsGame() {
        when(gameRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(gameRepository.save(any(CanonicalGame.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ImportGameCommand command = new ImportGameCommand("Some Game", null, null, null, null);
        SingleImportResult result = service.importSingleGame(command, UUID.randomUUID());

        assertTrue(result.created());
        assertNotNull(result.gameId());
        verify(collectionPort).addGameToCollection(any(UUID.class), any(UUID.class), isNull());
    }

    @Test
    @DisplayName("importSingleGame with steam store parses the app id into steam data")
    void importSingleGame_withSteamStore_setsSteamData() {
        when(gameRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(gameRepository.save(any(CanonicalGame.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ImportGameCommand command = new ImportGameCommand("Half-Life 2", "steam", "220", null, null);
        SingleImportResult result = service.importSingleGame(command, UUID.randomUUID());

        assertTrue(result.created());
        verify(gameRepository).save(argThat((CanonicalGame game) ->
                game.getSteamData() != null && game.getSteamData().appId() == 220));
    }
}

package com.robertforpresent.spring_api.games.application.service;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {
    @Mock
    private GameRepository repository;

    @InjectMocks
    private GameService service;

    @AfterEach
    void tearDown() {
    }

    @Test
    void testGetAllGames() {
        List<Game> expected = List.of(Game.builder().id("1").name("Stardew Valley").build());
        when(repository.findAll()).thenReturn(expected);
        assertEquals(1, service.getAllGames().size());
    }
}

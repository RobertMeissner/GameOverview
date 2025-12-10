package com.robertforpresent.api.config;

import com.robertforpresent.api.games.domain.Game;
import com.robertforpresent.api.games.domain.repository.GameRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class DataSeederTest {
    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private DataSeeder dataSeeder;

    @Test
    void run() {
        List<Game> games = gameRepository.findAll();

        assertFalse(games.isEmpty());
        assertEquals(5, games.size());
    }
}
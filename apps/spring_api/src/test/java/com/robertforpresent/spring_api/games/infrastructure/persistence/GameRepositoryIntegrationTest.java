package com.robertforpresent.spring_api.games.infrastructure.persistence;

import com.robertforpresent.spring_api.games.domain.Game;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({GameEntityMapper.class, JpaGameRepositoryAdapter.class})
public class GameRepositoryIntegrationTest {

    @Autowired
    private JpaGameRepository jpaGameRepository;

    @Autowired
    private GameEntityMapper mapper;

    @Autowired
    private JpaGameRepositoryAdapter gameRepository;

    @BeforeEach
    void setUp(){
        jpaGameRepository.deleteAll();
    }

    // TODO: remove, as soon as DataJpaTest import issue is resolved
    @Test
    public void testSaveAndRetrieve(){
        // given
        Game game = Game.builder().name("Stardew Valley").build();

        // when
        Game savedGame = gameRepository.save(game);

        // then
        assertNotNull(savedGame.getId(), "saved game should have auto-generated ID");
        assertEquals(game.getName(), savedGame.getName());
    }
    @Test
    public void testFindAll(){
        // given
        Game game = Game.builder().name("Stardew Valley").build();
        gameRepository.save(game);
        game = Game.builder().name("Half-Life").build();
        gameRepository.save(game);

        // when
        List<Game> games= gameRepository.findAll();

        // then
        assertEquals(2, games.size(), "retrieved games should have right size");
    }

    @Test
    public void testFindById(){

        // given
        Game game = Game.builder().name("Stardew Valley").build();
        Game desiredGame = gameRepository.save(game);
        game = Game.builder().name("Half-Life").build();
        gameRepository.save(game);

        // when
        Optional<Game> foundGame = gameRepository.findById(desiredGame.getId());

        // then
        assertTrue(foundGame.isPresent());

        assertEquals("Stardew Valley", foundGame.get().getName());
    }
}

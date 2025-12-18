package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import({CanonicalGameRepositoryAdapter.class, CanonicalGameEntityMapper.class})
public class CanonicalGameRepositoryIntegrationTest {

    @Autowired
    private SpringDataCanonicalGameRepository springDataRepository;

    @Autowired
    private CanonicalGameRepository repository;

    @BeforeEach
    void setUp(){
        springDataRepository.deleteAll();
    }

    @Test
    public void testSaveAndRetrieve(){
        // given
        CanonicalGame game = new CanonicalGame.Builder("Stardew Valley").build();

        // when
        CanonicalGame savedGame = repository.save(game);

        // then
        assertNotNull(savedGame.getId(), "saved game should have auto-generated ID");
        assertEquals(game.getName(), savedGame.getName());
    }
    @Test
    public void testFindAll(){
        // given
        CanonicalGame game = new CanonicalGame.Builder("Stardew Valley").build();
        repository.save(game);
        game = new CanonicalGame.Builder("Half-Life").build();
        repository.save(game);

        // when
        List<CanonicalGame> games= repository.findAll();

        // then
        assertEquals(2, games.size(), "retrieved games should have right size");
    }

    @Test
    public void testFindById(){

        // given
        CanonicalGame game =new CanonicalGame.Builder("Stardew Valley").build();
        CanonicalGame desiredGame = repository.save(game);
        game =new CanonicalGame.Builder("Half-Life").build();
        repository.save(game);

        // when
        Optional<CanonicalGame> foundGame = repository.findById(desiredGame.getId());

        // then
        assertTrue(foundGame.isPresent());

        assertEquals("Stardew Valley", foundGame.get().getName());
    }
}

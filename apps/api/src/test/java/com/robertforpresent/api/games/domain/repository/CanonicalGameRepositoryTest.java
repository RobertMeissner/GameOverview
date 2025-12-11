package com.robertforpresent.api.games.domain.repository;

import com.robertforpresent.api.games.domain.model.CanonicalGame;
import com.robertforpresent.api.games.infrastructure.persistence.CanonicalGameEntityMapper;
import com.robertforpresent.api.games.infrastructure.persistence.CanonicalGameRepositoryAdapter;
import com.robertforpresent.api.games.infrastructure.persistence.SpringDataCanonicalGameRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({CanonicalGameRepositoryAdapter.class, CanonicalGameEntityMapper.class})
class CanonicalGameRepositoryTest {
    @Autowired
    private SpringDataCanonicalGameRepository jpaRepository;
    @Autowired
    private CanonicalGameRepository repository;

    @BeforeEach
    void setUp(){
        jpaRepository.deleteAll();
    }
    @Test
    void testFindById() {
        // Given
        var game = new CanonicalGame.Builder("test").build();
        var saved = repository.save(game);

        // When
        var found = repository.findById(game.getId());

        // Then
        assertNotNull(found);
        assertTrue(found.isPresent());
        var foundGame = found.get();
        assertEquals(foundGame.getId(), saved.getId());
        assertEquals(foundGame.getId(), game.getId());
    }

}
package com.robertforpresent.api.games.infrastructure.persistence;

import com.robertforpresent.api.games.domain.Game;
import com.robertforpresent.api.games.domain.repository.GameRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class InMemoryGameRepository implements GameRepository {
    @Override
    public List<Game> findAll() {
        return List.of(Game.builder().name("Half Life").build(),
                Game.builder().name("Stardew Valley").build(),
                Game.builder().name("Planescape Torment").build());
    }

    @Override
    public Optional<Game> findById(String id) {
        return Optional.empty();
    }

    @Override
    public Game save(Game game) {
        return null;
    }

    @Override
    public void deleteById(String id) {

    }

    @Override
    public List<Game> findTopByRating() {
        return List.of();
    }
}

package com.robertforpresent.spring_api.games.infrastructure.persistence;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class InMemoryGameRepository implements GameRepository {
    @Override
    public List<Game> findAll() {
        return List.of(Game.create("Half Life"), Game.create("Stardew Valley"), Game.create("Planescape Torment"));
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
}

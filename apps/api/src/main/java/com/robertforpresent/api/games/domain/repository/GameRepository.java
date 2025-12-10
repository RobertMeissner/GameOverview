package com.robertforpresent.api.games.domain.repository;

import com.robertforpresent.api.games.domain.Game;

import java.util.List;
import java.util.Optional;

public interface GameRepository {
    List<Game> findAll();

    Optional<Game> findById(String id);

    Game save(Game game);

    void deleteById(String id);

    List<Game> findTopByRating();
}

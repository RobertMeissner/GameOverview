package com.robertforpresent.spring_api.games.domain.repository;

import com.robertforpresent.spring_api.games.domain.Game;

import java.util.List;
import java.util.Optional;

public interface GameRepository {
    List<Game> findAll();
    Optional<Game> findById(String id);
    Game save(Game game);
    void deleteById(String id);
}

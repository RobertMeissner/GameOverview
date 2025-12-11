package com.robertforpresent.api.games.application.service;

import com.robertforpresent.api.games.domain.Game;
import com.robertforpresent.api.games.domain.model.CanonicalGame;
import com.robertforpresent.api.games.domain.repository.GameRepository;
import com.robertforpresent.api.games.domain.service.CatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GameService {
    private final GameRepository repository;

    private final CatalogService catalog;

    public GameService(GameRepository repository, CatalogService catalog) {
        this.repository = repository;
        this.catalog = catalog;
    }

    public List<Game> getAllGames() {
        return repository.findAll();
    }

    public List<Game> getTopGames() {
        return repository.findTopByRating();
    }

    public List<Game> getCatalog() {
        CanonicalGame game = catalog.get(UUID.randomUUID());
        return List.of(Game.builder().name(game.getName()).build());
    }
}

package com.robertforpresent.spring_api.games.application.service;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameService {
    private final GameRepository repository;

    public GameService(GameRepository repository) {
        this.repository = repository;
    }

    public List<Game> getAllGames(){
        return repository.findAll();
    }

    public List<Game> getTopGames() {
        return repository.findTopByRating();
    }
}

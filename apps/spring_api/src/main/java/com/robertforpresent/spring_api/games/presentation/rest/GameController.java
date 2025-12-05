package com.robertforpresent.spring_api.games.presentation.rest;

import com.robertforpresent.spring_api.games.application.service.GameService;
import com.robertforpresent.spring_api.games.domain.Game;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class GameController {
    private final GameService service;

    public GameController(GameService service) {
        this.service = service;
    }

    @GetMapping("/games")
    public List<Game> games() {
        return service.getAllGames();
    }
}

package com.robertforpresent.spring_api.games.presentation.rest;

import com.robertforpresent.spring_api.games.application.service.GameService;
import com.robertforpresent.spring_api.games.domain.Game;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class GameController {
    private final GameService service;

    public GameController(GameService service) {
        this.service = service;
    }

    @GetMapping("/games")
    public List<Game> games() {
        return service.getAllGames();
    }

    @GetMapping("/games/top")
    public List<Game> topGames(){
        return service.getTopGames();
    }
}

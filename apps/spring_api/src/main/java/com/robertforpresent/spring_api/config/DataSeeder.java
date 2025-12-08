package com.robertforpresent.spring_api.config;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    private final GameRepository gameRepository;

    public DataSeeder(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (gameRepository.findAll().isEmpty()) {
            seedGames();
        }
    }

    private void seedGames() {
        List<Game> games = List.of(Game.create("Stardey Valley"), Game.create("Half Life"), Game.create("Planescape Torment"), Game.create("Monkey Island"));
        for (Game game : games) {
            gameRepository.save(game);
        }


    }
}

package com.robertforpresent.spring_api.config;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final GameRepository gameRepository;

    public DataSeeder(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (gameRepository.findAll().isEmpty()) {
            log.debug("H2 database empty. Seeding now with test games.");
            seedGames();
        }
    }

    private String thumbnail(int appId) {
        return String.format("https://steamcdn-a.akamaihd.net/steam/apps/%s/header.jpg", appId);
    }

    private void seedGames() {
        List<Game> games = List.of(Game.builder().name("Stardey Valley").rating(100).thumbnailUrl(thumbnail(413150)).build(),
                Game.builder().name("Half Life").rating(80).thumbnailUrl(thumbnail(70)).build(),
                Game.builder().name("Planescape Torment").rating(60).thumbnailUrl(thumbnail(613230)).build(),
                Game.builder().name("Monkey Island").rating(90).thumbnailUrl(thumbnail(32360)).build());
        games.forEach(gameRepository::save);
    }
}

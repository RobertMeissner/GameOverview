package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.application.command.UpdateCatalogCommand;
import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application service for catalog operations.
 * Contains business logic for managing the game catalog.
 */
@Service
public class CatalogService {
    private final CanonicalGameRepository repository;

    public CatalogService(CanonicalGameRepository repository) {
        this.repository = repository;
    }

    public CanonicalGame get(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public List<CanonicalGame> getAllGames() {
        return repository.findAll();
    }

    public Optional<CanonicalGame> findByName(String name) {
        return repository.findAll().stream()
                .filter(g -> g.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    public CanonicalGame save(CanonicalGame game) {
        return repository.save(game);
    }

    /**
     * Update catalog values for a game.
     *
     * @param id      The game ID
     * @param command The update command with new values
     * @return The updated game
     */
    public CanonicalGame updateCatalogValues(UUID id, UpdateCatalogCommand command) {
        CanonicalGame existing = repository.findById(id).orElseThrow();

        // Build updated Steam data
        SteamGameData existingSteam = existing.getSteamData();
        SteamGameData newSteamData = new SteamGameData(
                command.steamAppId() != null ? command.steamAppId() : (existingSteam != null ? existingSteam.appId() : null),
                command.steamName() != null ? command.steamName() : (existingSteam != null ? existingSteam.name() : null)
        );

        // Build updated GoG data
        GogGameData existingGog = existing.getGogData();
        GogGameData newGogData = new GogGameData(
                command.gogId() != null ? command.gogId() : (existingGog != null ? existingGog.gogId() : null),
                command.gogName() != null ? command.gogName() : (existingGog != null ? existingGog.name() : null),
                command.gogLink() != null ? command.gogLink() : (existingGog != null ? existingGog.link() : null)
        );

        // Build updated Epic Games data
        EpicGameData existingEpic = existing.getEpicData();
        EpicGameData newEpicData = new EpicGameData(
                command.epicId() != null ? command.epicId() : (existingEpic != null ? existingEpic.epicId() : null),
                command.epicName() != null ? command.epicName() : (existingEpic != null ? existingEpic.name() : null),
                command.epicLink() != null ? command.epicLink() : (existingEpic != null ? existingEpic.link() : null)
        );

        // Build updated Metacritic data
        MetacriticGameData existingMc = existing.getMetacriticData();
        MetacriticGameData newMetacriticData = new MetacriticGameData(
                command.metacriticScore() != null ? command.metacriticScore() : (existingMc != null ? existingMc.score() : null),
                command.metacriticName() != null ? command.metacriticName() : (existingMc != null ? existingMc.gameName() : null),
                command.metacriticLink() != null ? command.metacriticLink() : (existingMc != null ? existingMc.link() : null)
        );

        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(existing.getThumbnailUrl())
                .setSteamData(newSteamData)
                .setGogData(newGogData)
                .setEpicData(newEpicData)
                .setMetacriticData(newMetacriticData)
                .build();
        return repository.save(updated);
    }
}

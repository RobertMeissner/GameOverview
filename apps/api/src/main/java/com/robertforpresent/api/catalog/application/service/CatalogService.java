package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.presentation.rest.UpdateCatalogRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CatalogService {
    private final CanonicalGameRepository repository;

    public CanonicalGame get(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public CatalogService(CanonicalGameRepository repository) {
        this.repository = repository;
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

    public CanonicalGame updateCatalogValues(UUID id, UpdateCatalogRequest request) {
        CanonicalGame existing = repository.findById(id).orElseThrow();

        // Build updated Steam data
        SteamGameData existingSteam = existing.getSteamData();
        SteamGameData newSteamData = new SteamGameData(
                request.steamAppId() != null ? request.steamAppId() : (existingSteam != null ? existingSteam.appId() : null),
                request.steamName() != null ? request.steamName() : (existingSteam != null ? existingSteam.name() : null)
        );

        // Build updated GoG data
        GogGameData existingGog = existing.getGogData();
        GogGameData newGogData = new GogGameData(
                request.gogId() != null ? request.gogId() : (existingGog != null ? existingGog.gogId() : null),
                request.gogName() != null ? request.gogName() : (existingGog != null ? existingGog.name() : null),
                request.gogLink() != null ? request.gogLink() : (existingGog != null ? existingGog.link() : null)
        );

        // Build updated Epic Games data
        EpicGameData existingEpic = existing.getEpicData();
        EpicGameData newEpicData = new EpicGameData(
                request.epicId() != null ? request.epicId() : (existingEpic != null ? existingEpic.epicId() : null),
                request.epicName() != null ? request.epicName() : (existingEpic != null ? existingEpic.name() : null),
                request.epicLink() != null ? request.epicLink() : (existingEpic != null ? existingEpic.link() : null)
        );

        // Build updated Metacritic data
        MetacriticGameData existingMc = existing.getMetacriticData();
        MetacriticGameData newMetacriticData = new MetacriticGameData(
                request.metacriticScore() != null ? request.metacriticScore() : (existingMc != null ? existingMc.score() : null),
                request.metacriticName() != null ? request.metacriticName() : (existingMc != null ? existingMc.gameName() : null),
                request.metacriticLink() != null ? request.metacriticLink() : (existingMc != null ? existingMc.link() : null)
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

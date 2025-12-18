package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public CanonicalGame updateCatalogValues(UUID id, Integer steamAppId, String steamName) {
        CanonicalGame existing = repository.findById(id).orElseThrow();
        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(existing.getThumbnailUrl())
                .setSteamAppId(steamAppId != null ? steamAppId : existing.getSteamAppId())
                .setSteamName(steamName != null ? steamName : existing.getSteamName())
                .build();
        return repository.save(updated);
    }
}

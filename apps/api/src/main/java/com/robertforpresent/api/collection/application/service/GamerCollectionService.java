package com.robertforpresent.api.collection.application.service;

import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.GamerCollectionRepository;
import com.robertforpresent.api.games.domain.model.CanonicalGame;
import com.robertforpresent.api.games.domain.service.CatalogService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GamerCollectionService {
    private final GamerCollectionRepository repository;
    private final CatalogService catalog;

    public List<CollectionGameView> getCollection(UUID gamerId){
        return repository.findByGamerId(gamerId).stream().map(this::toView).toList();
    }

    public GamerCollectionService(GamerCollectionRepository repository, CatalogService catalog) {
        this.repository = repository;
        this.catalog = catalog;
    }

    private CollectionGameView toView(PersonalizedGame pg){
        CanonicalGame canonical = catalog.get(pg.getCanonicalGameId());
        return new CollectionGameView(pg.getCanonicalGameId(), canonical.getName(), canonical.getThumbnailUrl());
    }
}

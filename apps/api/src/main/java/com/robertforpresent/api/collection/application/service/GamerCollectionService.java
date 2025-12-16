package com.robertforpresent.api.collection.application.service;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class GamerCollectionService {
    private final CollectionRepository repository;
    private final CatalogService catalog;

    public List<CollectionGameView> getCollection(UUID gamerId) {
        return repository.findByGamerId(gamerId).stream().map(this::toView).toList();
    }

    public List<CollectionGameView> getTop3(UUID gamerId) {
        return getCollection(gamerId).stream().sorted(Comparator.comparing(CollectionGameView::rating).reversed()).limit(3).toList();
    }

    public GamerCollectionService(CollectionRepository repository, CatalogService catalog) {
        this.repository = repository;
        this.catalog = catalog;
    }

    private CollectionGameView toView(PersonalizedGame pg) {
        CanonicalGame canonical = catalog.get(pg.getCanonicalGameId());
        return new CollectionGameView(pg.getCanonicalGameId(), canonical.getName(),
                canonical.getThumbnailUrl(), canonical.getRating(),
                pg.isMarkedAsPlayed(), pg.isMarkedAsHidden(), pg.isMarkedForLater());
    }
}

package com.robertforpresent.api.collection.application.service;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.collection.application.dto.AdminGameView;
import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import com.robertforpresent.api.collection.presentation.rest.UpdateFlagsRequest;
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
        return getCollection(gamerId).stream()
                .filter(game -> !game.markedAsPlayed() && !game.markedAsHidden() && !game.markedForLater())
                .sorted(Comparator.comparing(CollectionGameView::rating).reversed())
                .limit(3)
                .toList();
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

    public CollectionGameView updateFlags(UUID gamerId, UUID canonicalGameId, UpdateFlagsRequest request) {
        PersonalizedGame game = repository.updateFlags(gamerId, canonicalGameId, request.markedAsPlayed(), request.markedAsHidden(), request.markedForLater());
        return toView(game);
    }

    public List<AdminGameView> getAdminCollection(UUID gamerId) {
        return repository.findByGamerId(gamerId).stream().map(this::toAdminView).toList();
    }

    public List<CollectionGameView> getBacklog(UUID gamerId) {
        return getCollection(gamerId).stream()
                .filter(CollectionGameView::markedForLater)
                .sorted(Comparator.comparing(CollectionGameView::rating).reversed())
                .toList();
    }

    private AdminGameView toAdminView(PersonalizedGame pg) {
        CanonicalGame canonical = catalog.get(pg.getCanonicalGameId());
        return new AdminGameView(
                pg.getCanonicalGameId(),
                canonical.getName(),
                canonical.getThumbnailUrl(),
                canonical.getRating(),
                pg.isMarkedAsPlayed(),
                pg.isMarkedAsHidden(),
                pg.isMarkedForLater(),
                canonical.getSteamAppId(),
                canonical.getSteamName()
        );
    }
}

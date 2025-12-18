package com.robertforpresent.api.collection.application.service;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.MetacriticGameData;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.collection.application.dto.AdminGameView;
import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.application.dto.StoreLinksDTO;
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
        StoreLinksDTO storeLinks = buildStoreLinks(canonical);
        return new CollectionGameView(
                pg.getCanonicalGameId(),
                canonical.getName(),
                canonical.getThumbnailUrl(),
                canonical.getRating(),
                pg.isMarkedAsPlayed(),
                pg.isMarkedAsHidden(),
                pg.isMarkedForLater(),
                storeLinks
        );
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
        SteamGameData steamData = canonical.getSteamData();
        GogGameData gogData = canonical.getGogData();
        MetacriticGameData metacriticData = canonical.getMetacriticData();

        return new AdminGameView(
                pg.getCanonicalGameId(),
                canonical.getName(),
                canonical.getThumbnailUrl(),
                canonical.getRating(),
                pg.isMarkedAsPlayed(),
                pg.isMarkedAsHidden(),
                pg.isMarkedForLater(),
                // Steam data
                steamData != null ? steamData.appId() : null,
                steamData != null ? steamData.name() : null,
                steamData != null ? steamData.storeLink() : null,
                // GoG data
                gogData != null ? gogData.gogId() : null,
                gogData != null ? gogData.name() : null,
                gogData != null ? gogData.storeLink() : null,
                // Metacritic data
                metacriticData != null ? metacriticData.score() : null,
                metacriticData != null ? metacriticData.gameName() : null,
                metacriticData != null ? metacriticData.storeLink() : null
        );
    }

    private StoreLinksDTO buildStoreLinks(CanonicalGame canonical) {
        SteamGameData steamData = canonical.getSteamData();
        GogGameData gogData = canonical.getGogData();
        MetacriticGameData metacriticData = canonical.getMetacriticData();

        return new StoreLinksDTO(
                steamData != null ? steamData.storeLink() : null,
                gogData != null ? gogData.storeLink() : null,
                metacriticData != null ? metacriticData.storeLink() : null
        );
    }
}

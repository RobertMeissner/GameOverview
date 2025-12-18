package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.catalog.infrastructure.persistence.steam.SteamRatingEmbeddable;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.util.UUID;


@Component
public class CanonicalGameEntityMapper {
    public CanonicalGame toDomain(CanonicalGameEntity entity) {
        SteamRating steamRating = mapSteamRatingToDomain(entity.getSteamRating());
        return new CanonicalGame.Builder(entity.getName()).setId(UUID.fromString(entity.getId())).setSteamRating(steamRating).setThumbnailUrl(entity.getThumbnailUrl()).build();
    }

    public CanonicalGameEntity toEntity(CanonicalGame domain) {
        SteamRatingEmbeddable steamRating = mapSteamRatingToEmbeddable(
                domain.getRatings().steam()  // @Nullable field
        );
        return new CanonicalGameEntity(domain.getId().toString(), domain.getName(), steamRating, domain.getThumbnailUrl());
    }

    @Nullable
    private SteamRating mapSteamRatingToDomain(@Nullable SteamRatingEmbeddable embeddable) {
        if (embeddable == null) return null;
        return SteamRating.of(
                embeddable.getPositive(),
                embeddable.getNegative(),
                embeddable.getSentiment()
        );
    }

    @Nullable
    private SteamRatingEmbeddable mapSteamRatingToEmbeddable(@Nullable SteamRating rating) {
        if (rating == null) return null;
        return new SteamRatingEmbeddable(
                rating.positive(),
                rating.negative(),
                rating.sentiment()
        );
    }
}


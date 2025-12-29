package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.EpicGameData;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.MetacriticGameData;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.catalog.infrastructure.persistence.steam.SteamRatingEmbeddable;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.util.UUID;


@Component
public class CanonicalGameEntityMapper {
    public CanonicalGame toDomain(CanonicalGameEntity entity) {
        SteamRating steamRating = mapSteamRatingToDomain(entity.getSteamRating());
        SteamGameData steamData = mapSteamDataToDomain(entity);
        GogGameData gogData = mapGogDataToDomain(entity);
        EpicGameData epicData = mapEpicDataToDomain(entity);
        MetacriticGameData metacriticData = mapMetacriticDataToDomain(entity);

        return new CanonicalGame.Builder(entity.getName())
                .setId(UUID.fromString(entity.getId()))
                .setSteamRating(steamRating)
                .setThumbnailUrl(entity.getThumbnailUrl())
                .setSteamData(steamData)
                .setGogData(gogData)
                .setEpicData(epicData)
                .setMetacriticData(metacriticData)
                .build();
    }

    public CanonicalGameEntity toEntity(CanonicalGame domain) {
        SteamRatingEmbeddable steamRating = mapSteamRatingToEmbeddable(
                domain.getRatings().steam()
        );

        SteamGameData steamData = domain.getSteamData();
        GogGameData gogData = domain.getGogData();
        EpicGameData epicData = domain.getEpicData();
        MetacriticGameData metacriticData = domain.getMetacriticData();

        return new CanonicalGameEntity(
                domain.getId().toString(),
                domain.getName(),
                steamRating,
                domain.getThumbnailUrl(),
                steamData != null ? steamData.appId() : null,
                steamData != null ? steamData.name() : null,
                gogData != null ? gogData.gogId() : null,
                gogData != null ? gogData.name() : null,
                gogData != null ? gogData.link() : null,
                epicData != null ? epicData.epicId() : null,
                epicData != null ? epicData.name() : null,
                epicData != null ? epicData.link() : null,
                metacriticData != null ? metacriticData.score() : null,
                metacriticData != null ? metacriticData.gameName() : null,
                metacriticData != null ? metacriticData.link() : null
        );
    }

    @Nullable
    private SteamGameData mapSteamDataToDomain(CanonicalGameEntity entity) {
        if (entity.getSteamAppId() == null && entity.getSteamName() == null) {
            return null;
        }
        return new SteamGameData(entity.getSteamAppId(), entity.getSteamName());
    }

    @Nullable
    private GogGameData mapGogDataToDomain(CanonicalGameEntity entity) {
        if (entity.getGogId() == null && entity.getGogName() == null && entity.getGogLink() == null) {
            return null;
        }
        return new GogGameData(entity.getGogId(), entity.getGogName(), entity.getGogLink());
    }

    @Nullable
    private EpicGameData mapEpicDataToDomain(CanonicalGameEntity entity) {
        if (entity.getEpicId() == null && entity.getEpicName() == null && entity.getEpicLink() == null) {
            return null;
        }
        return new EpicGameData(entity.getEpicId(), entity.getEpicName(), entity.getEpicLink());
    }

    @Nullable
    private MetacriticGameData mapMetacriticDataToDomain(CanonicalGameEntity entity) {
        if (entity.getMetacriticScore() == null && entity.getMetacriticName() == null && entity.getMetacriticLink() == null) {
            return null;
        }
        return new MetacriticGameData(entity.getMetacriticScore(), entity.getMetacriticName(), entity.getMetacriticLink());
    }

    @Nullable
    private SteamRating mapSteamRatingToDomain(@Nullable SteamRatingEmbeddable embeddable) {
        if (embeddable == null) return null;
        if (embeddable.getPositive() == null || embeddable.getNegative() == null || embeddable.getSentiment() == null) {
            return null;
        }
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


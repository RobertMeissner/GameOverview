package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.infrastructure.persistence.steam.SteamRatingEmbeddable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "canonical_games")
public class CanonicalGameEntity {

    @Getter
    @Setter
    @Id
    private UUID id;


    @Getter
    @Setter
    @Column(nullable = false)
    private String name;

    @Getter
    @Setter
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "positive", column = @Column(name = "steam_positive")),
            @AttributeOverride(name = "negative", column = @Column(name = "steam_negative")),
            @AttributeOverride(name = "sentiment", column = @Column(name = "steam_sentiment"))
    })
    private SteamRatingEmbeddable steamRating;  // null if no Steam data

    @Getter
    @Setter
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    public CanonicalGameEntity(UUID id, String name, SteamRatingEmbeddable steamRating, String thumbnailUrl) {
        this.id = id;
        this.name = name;
        this.steamRating = steamRating;
        this.thumbnailUrl = thumbnailUrl;
    }

    public CanonicalGameEntity(){}
}

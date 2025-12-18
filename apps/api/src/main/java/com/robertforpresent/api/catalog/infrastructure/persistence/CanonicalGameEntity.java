package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.infrastructure.persistence.steam.SteamRatingEmbeddable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "canonical_games")
public class CanonicalGameEntity {

    @Getter
    @Setter
    @Id
    private String id;


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

    @Getter
    @Setter
    @Column(name = "steam_app_id")
    private Integer steamAppId;

    @Getter
    @Setter
    @Column(name = "steam_name")
    private String steamName;

    public CanonicalGameEntity(String id, String name, SteamRatingEmbeddable steamRating, String thumbnailUrl, Integer steamAppId, String steamName) {
        this.id = id;
        this.name = name;
        this.steamRating = steamRating;
        this.thumbnailUrl = thumbnailUrl;
        this.steamAppId = steamAppId;
        this.steamName = steamName;
    }

    public CanonicalGameEntity(){}
}

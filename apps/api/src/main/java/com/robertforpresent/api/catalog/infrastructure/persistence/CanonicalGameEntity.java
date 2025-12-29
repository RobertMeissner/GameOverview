package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.infrastructure.persistence.steam.SteamRatingEmbeddable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "canonical_games", indexes = {
        @Index(name = "idx_canonical_game_name", columnList = "name"),
        @Index(name = "idx_canonical_game_steam_app_id", columnList = "steam_app_id"),
        @Index(name = "idx_canonical_game_gog_id", columnList = "gog_id"),
        @Index(name = "idx_canonical_game_epic_id", columnList = "epic_id")
})
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

    // GOG store data
    @Getter
    @Setter
    @Column(name = "gog_id")
    private Long gogId;

    @Getter
    @Setter
    @Column(name = "gog_name")
    private String gogName;

    @Getter
    @Setter
    @Column(name = "gog_link")
    private String gogLink;

    // Epic Games store data
    @Getter
    @Setter
    @Column(name = "epic_id")
    private String epicId;

    @Getter
    @Setter
    @Column(name = "epic_name")
    private String epicName;

    @Getter
    @Setter
    @Column(name = "epic_link")
    private String epicLink;

    // Metacritic data
    @Getter
    @Setter
    @Column(name = "metacritic_score")
    private Integer metacriticScore;

    @Getter
    @Setter
    @Column(name = "metacritic_name")
    private String metacriticName;

    @Getter
    @Setter
    @Column(name = "metacritic_link")
    private String metacriticLink;

    public CanonicalGameEntity(String id, String name, SteamRatingEmbeddable steamRating, String thumbnailUrl,
                               Integer steamAppId, String steamName,
                               Long gogId, String gogName, String gogLink,
                               String epicId, String epicName, String epicLink,
                               Integer metacriticScore, String metacriticName, String metacriticLink) {
        this.id = id;
        this.name = name;
        this.steamRating = steamRating;
        this.thumbnailUrl = thumbnailUrl;
        this.steamAppId = steamAppId;
        this.steamName = steamName;
        this.gogId = gogId;
        this.gogName = gogName;
        this.gogLink = gogLink;
        this.epicId = epicId;
        this.epicName = epicName;
        this.epicLink = epicLink;
        this.metacriticScore = metacriticScore;
        this.metacriticName = metacriticName;
        this.metacriticLink = metacriticLink;
    }

    public CanonicalGameEntity(){}
}

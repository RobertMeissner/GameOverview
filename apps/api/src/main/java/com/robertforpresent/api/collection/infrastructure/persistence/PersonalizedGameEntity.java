package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "personalized_games")
public class PersonalizedGameEntity {

    @Getter
    @Setter
    @Id
    @GeneratedValue
    private String id;

    @Getter
    @Setter
    @Column(name = "gamer_id", nullable = false)
    private String gamerId;

    @Getter
    @Setter
    @Column(name = "canonical_game_id", nullable = false)
    private String canonicalGameId;

    @Getter
    @Setter
    @Column(name = "mark_as_played", nullable = false)
    private boolean markAsPlayed;


    @Getter
    @Setter
    @Column(name = "mark_as_hidden", nullable = false)
    private boolean markAsHidden;

    @Getter
    @Setter
    @Column(name = "mark_as_for_later", nullable = false)
    private boolean markAsForLater;

    @Getter
    @Setter
    @Column(name = "steam_playtime_minutes")
    private Integer steamPlaytimeMinutes;

    // Store ownership indicators
    @Getter
    @Setter
    @Column(name = "owned_on_steam", nullable = false, columnDefinition = "boolean default false")
    private boolean ownedOnSteam;

    @Getter
    @Setter
    @Column(name = "owned_on_gog", nullable = false, columnDefinition = "boolean default false")
    private boolean ownedOnGog;

    @Getter
    @Setter
    @Column(name = "owned_on_epic", nullable = false, columnDefinition = "boolean default false")
    private boolean ownedOnEpic;

    @Getter
    @Setter
    @Column(name = "owned_on_xbox", nullable = false, columnDefinition = "boolean default false")
    private boolean ownedOnXbox;

    @Getter
    @Setter
    @Column(name = "owned_on_playstation", nullable = false, columnDefinition = "boolean default false")
    private boolean ownedOnPlayStation;

    @Getter
    @Setter
    @Column(name = "other_stores")
    private String otherStores;

    public PersonalizedGameEntity(String gamerId, String canonicalGameId, boolean markAsPlayed, boolean markAsHidden, boolean markAsForLater, Integer steamPlaytimeMinutes, boolean ownedOnSteam, boolean ownedOnGog, boolean ownedOnEpic, boolean ownedOnXbox, boolean ownedOnPlayStation, String otherStores) {
        this.gamerId = gamerId;
        this.canonicalGameId = canonicalGameId;
        this.markAsPlayed = markAsPlayed;
        this.markAsHidden = markAsHidden;
        this.markAsForLater = markAsForLater;
        this.steamPlaytimeMinutes = steamPlaytimeMinutes;
        this.ownedOnSteam = ownedOnSteam;
        this.ownedOnGog = ownedOnGog;
        this.ownedOnEpic = ownedOnEpic;
        this.ownedOnXbox = ownedOnXbox;
        this.ownedOnPlayStation = ownedOnPlayStation;
        this.otherStores = otherStores;

    }

    public PersonalizedGameEntity(){}

    public static PersonalizedGameEntity from(PersonalizedGame game){
        return new PersonalizedGameEntity(game.getGamerId().toString(), game.getCanonicalGameId().toString(), game.isMarkedAsPlayed(), game.isMarkedAsHidden(), game.isMarkedForLater(), game.getSteamPlaytimeMinutes(), game.isOwnedOnSteam(), game.isOwnedOnGog(), game.isOwnedOnEpic(), game.isOwnedOnXbox(), game.isOwnedOnPlayStation(), game.getOtherStores());
    }
}

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

    public PersonalizedGameEntity(String gamerId, String canonicalGameId, boolean markAsPlayed, boolean markAsHidden, boolean markAsForLater) {
        this.gamerId = gamerId;
        this.canonicalGameId = canonicalGameId;
        this.markAsPlayed = markAsPlayed;
        this.markAsHidden = markAsHidden;
        this.markAsForLater = markAsForLater;

    }

    public PersonalizedGameEntity(){}

    public static PersonalizedGameEntity from(PersonalizedGame game){
        return new PersonalizedGameEntity(game.getGamerId().toString(), game.getCanonicalGameId().toString(), game.isMarkedAsPlayed(), game.isMarkedAsHidden(), game.isMarkedForLater());
    }
}

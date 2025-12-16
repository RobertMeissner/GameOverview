package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "personalized_games")
public class PersonalizedGameEntity {

    @Getter
    @Setter
    @Id
    @GeneratedValue
    private UUID id;

    @Getter
    @Setter
    @Column(nullable = false)
    private UUID gamerId;

    @Getter
    @Setter
    @Column(nullable = false)
    private UUID canonicalGameId;

    @Getter
    @Setter
    @Column(nullable = false)
    private boolean markAsPlayed;


    @Getter
    @Setter
    @Column(nullable = false)
    private boolean markAsHidden;

    @Getter
    @Setter
    @Column(nullable = false)
    private boolean markAsForLater;

    public PersonalizedGameEntity(UUID gamerId, UUID canonicalGameId, boolean markAsPlayed, boolean markAsHidden, boolean markAsForLater) {
        this.gamerId = gamerId;
        this.canonicalGameId = canonicalGameId;
        this.markAsPlayed = markAsPlayed;
        this.markAsHidden = markAsHidden;
        this.markAsForLater = markAsForLater;

    }

    public PersonalizedGameEntity(){}

    public static PersonalizedGameEntity from(PersonalizedGame game){
        return new PersonalizedGameEntity(game.getGamerId(), game.getCanonicalGameId(), game.isMarkedAsPlayed(), game.isMarkedAsHidden(), game.isMarkedForLater());
    }
}

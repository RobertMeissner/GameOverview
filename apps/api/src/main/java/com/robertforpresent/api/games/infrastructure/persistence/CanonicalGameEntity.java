package com.robertforpresent.api.games.infrastructure.persistence;

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

    public CanonicalGameEntity(UUID id, String name) {
        this.id = id;
        this.name = name;
    }

    public CanonicalGameEntity(){}
}

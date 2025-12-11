package com.robertforpresent.api.catalog.infrastructure.persistence;

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
    private float rating;
    @Getter
    @Setter
    private String thumbnailUrl;

    public CanonicalGameEntity(UUID id, String name, float rating, String thumbnailUrl) {
        this.id = id;
        this.name = name;
        this.rating = rating;
        this.thumbnailUrl = thumbnailUrl;
    }

    public CanonicalGameEntity(){}
}

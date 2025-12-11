package com.robertforpresent.api.collection.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name="collections")
public class GamerCollectionEntity {

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

    public GamerCollectionEntity(UUID gamerId, UUID canonicalGameId) {
        this.gamerId = gamerId;
        this.canonicalGameId = canonicalGameId;
    }

    public GamerCollectionEntity(){}
}

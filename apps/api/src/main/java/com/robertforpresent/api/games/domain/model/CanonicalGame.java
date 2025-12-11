package com.robertforpresent.api.games.domain.model;

import lombok.Getter;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A unified game identity aggregated from several sources, e.g. stores, meta plattforms, and such.
 *
 * <p>The core aggregate (? or entity) of the game catalog domain. </p>
 *
 * <h2>Decisions</h2>
 * <ul>
 *     <li>Generates its own UUID</li>
 *     <li>Store data is preserved in its raw form</li>
 * </ul>
 *
 * <h2>Invariants</h2>
 * <ul>
 *     <li>A game has at least a canonical name</li>
 *     <li>Store data map never contains null values</li>
 * </ul>
 */

public class CanonicalGame {
    @Getter
    private final UUID id;
    private String canonicalName;

    private CanonicalMetadata metadata;

    private final Map<GameStore, StoreGameData> storeData;

    private Instant createdAt;
    private Instant updatedAt;


    // public static CanonicalGame add(){}
    // public static CanonicalGame addStoreData(GameStore store){}

    public String getName() {
        return this.canonicalName;
    }

    /**
     * Explicit builder. Favoured over Lombok to have in-depth control
     */
    public static class Builder {
        private String name;
        private UUID id;

        public Builder(String name) {
            this.name = name;
        }

        public CanonicalGame build() {
            if (id == null) {
                this.id = UUID.randomUUID();
            }
            return new CanonicalGame(this);
        }

        public Builder setId(UUID id) {
            this.id = id;
            return this;
        }
    }

    private CanonicalGame(Builder builder) {
        id = builder.id;
        canonicalName = builder.name;
        storeData = Map.of();
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
}

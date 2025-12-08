package com.robertforpresent.spring_api.games.infrastructure.persistence;

// 6. Add getters and setters for both fields


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "games")
public class GameEntity {
    @Getter
    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Getter
    @Setter
    @Column(nullable = false)
    private String name;

    @Getter
    @Setter
    private float rating;

    public GameEntity() {
    }

    public GameEntity(String id, String name, float rating) {
        this.id = id;
        this.name = name;
        this.rating = rating;
    }

}

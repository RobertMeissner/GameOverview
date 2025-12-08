package com.robertforpresent.spring_api.games.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaGameRepository extends JpaRepository<GameEntity, String> {
    List<GameEntity> findTop3ByOrderByRatingDesc();
}

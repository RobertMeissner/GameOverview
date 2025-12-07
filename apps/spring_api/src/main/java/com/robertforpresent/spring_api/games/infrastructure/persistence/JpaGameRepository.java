package com.robertforpresent.spring_api.games.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaGameRepository extends JpaRepository<GameEntity, String> {
}

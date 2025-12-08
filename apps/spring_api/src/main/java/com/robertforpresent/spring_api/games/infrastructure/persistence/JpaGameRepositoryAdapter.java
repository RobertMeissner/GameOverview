package com.robertforpresent.spring_api.games.infrastructure.persistence;

import com.robertforpresent.spring_api.games.domain.Game;
import com.robertforpresent.spring_api.games.domain.repository.GameRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Primary
@Repository
public class JpaGameRepositoryAdapter implements GameRepository {

    private final JpaGameRepository jpaRepository;
    private final GameEntityMapper mapper;

    public JpaGameRepositoryAdapter(JpaGameRepository jpaRepository, GameEntityMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public List<Game> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Game> findById(String id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Game save(Game game) {
        GameEntity entity = mapper.toEntity(game);
        GameEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Game> findTopByRating() {
        return jpaRepository.findTop3ByOrderByRatingDesc().stream().map(mapper::toDomain).toList();
    }
}

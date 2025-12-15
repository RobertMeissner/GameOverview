package com.robertforpresent.api.collection.presentation.rest;

import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TopRankedMapper {
    TopRankedMapper INSTANCE = Mappers.getMapper(TopRankedMapper.class);

    TopRankedDTO toDto(CollectionGameView game);
}

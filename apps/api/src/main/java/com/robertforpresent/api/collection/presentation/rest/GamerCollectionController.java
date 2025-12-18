package com.robertforpresent.api.collection.presentation.rest;

import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.application.service.GamerCollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class GamerCollectionController {
    private final TopRankedMapper mapper;

    @Autowired
    private GamerCollectionService service;

    public GamerCollectionController(TopRankedMapper mapper) {
        this.mapper = mapper;
    }

    @GetMapping("/collection")
    public List<CollectionGameView> getCollection(@RequestParam UUID userId) {
        return service.getCollection(userId);
    }

    @GetMapping("/collection/top")
    public List<TopRankedDTO> getTop3(@RequestParam UUID userId) {
        return service.getTop3(userId).stream().map(mapper::toDto).toList();
    }

    @PatchMapping("/collection/games/{gameId}")
    public CollectionGameView updateFlags(@PathVariable UUID gameId, @RequestParam UUID userId, @RequestBody UpdateFlagsRequest request) {
        return service.updateFlags(userId, gameId, request);
    }

}

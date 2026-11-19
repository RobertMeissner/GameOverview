package com.robertforpresent.api.collection.presentation.rest;

import com.robertforpresent.api.collection.application.command.UpdateFlagsCommand;
import com.robertforpresent.api.collection.application.dto.AdminGameView;
import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.application.service.GamerCollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
public class GamerCollectionController {
    private final GamerCollectionService service;
    private final TopRankedMapper mapper;

    public GamerCollectionController(GamerCollectionService service, TopRankedMapper mapper) {
        this.service = service;
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
        UpdateFlagsCommand command = new UpdateFlagsCommand(request.markedAsPlayed(), request.markedAsHidden(), request.markedForLater());
        return service.updateFlags(userId, gameId, command);
    }

    @GetMapping("/collection/admin")
    public List<AdminGameView> getAdminCollection(@RequestParam UUID userId) {
        return service.getAdminCollection(userId);
    }

    @GetMapping("/collection/backlog")
    public List<CollectionGameView> getBacklog(@RequestParam UUID userId) {
        return service.getBacklog(userId);
    }

    /**
     * Get short and good games - games with HLTB playtime under maxHours and rating above minRating.
     *
     * @param userId    The user's ID
     * @param maxHours  Maximum hours to beat (default: 5)
     * @param minRating Minimum rating 0-100 (default: 80)
     * @return List of short and good games
     */
    @GetMapping("/collection/short-good")
    public List<CollectionGameView> getShortAndGoodGames(
            @RequestParam UUID userId,
            @RequestParam(defaultValue = "5") double maxHours,
            @RequestParam(defaultValue = "80") int minRating) {
        return service.getShortAndGoodGames(userId, maxHours, minRating);
    }

}

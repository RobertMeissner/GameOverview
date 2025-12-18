package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * API integration tests for CatalogController.
 *
 * <p>Uses @WebMvcTest for focused controller testing with mocked service layer.
 * Tests HTTP contract: endpoints, response codes, JSON structure.</p>
 */
@WebMvcTest(CatalogController.class)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CatalogService catalogService;

    @Test
    @DisplayName("GET /catalog returns list of games")
    void getCatalog_returnsListOfGames() throws Exception {
        // given
        List<CanonicalGame> games = List.of(
                createGame("Stardew Valley", 413150),
                createGame("Half-Life 2", 220)
        );
        when(catalogService.getAllGames()).thenReturn(games);

        // when/then
        mockMvc.perform(get("/catalog"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Stardew Valley")))
                .andExpect(jsonPath("$[1].name", is("Half-Life 2")));
    }

    @Test
    @DisplayName("GET /catalog returns empty list when no games")
    void getCatalog_returnsEmptyList_whenNoGames() throws Exception {
        // given
        when(catalogService.getAllGames()).thenReturn(Collections.emptyList());

        // when/then
        mockMvc.perform(get("/catalog"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /catalog returns game with thumbnail URL")
    void getCatalog_returnsGameWithThumbnailUrl() throws Exception {
        // given
        CanonicalGame game = new CanonicalGame.Builder("Test Game")
                .setThumbnailUrl("https://example.com/thumb.jpg")
                .build();
        when(catalogService.getAllGames()).thenReturn(List.of(game));

        // when/then
        mockMvc.perform(get("/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].thumbnailUrl", is("https://example.com/thumb.jpg")));
    }

    @Test
    @DisplayName("GET /catalog returns game with ratings")
    void getCatalog_returnsGameWithRatings() throws Exception {
        // given
        SteamRating rating = SteamRating.of(100, 10, ReviewSentiment.VERY_POSITIVE);
        CanonicalGame game = new CanonicalGame.Builder("Highly Rated Game")
                .setSteamRating(rating)
                .build();
        when(catalogService.getAllGames()).thenReturn(List.of(game));

        // when/then
        mockMvc.perform(get("/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ratings").exists())
                .andExpect(jsonPath("$[0].ratings.steam.positive", is(100)))
                .andExpect(jsonPath("$[0].ratings.steam.negative", is(10)));
    }

    @Test
    @DisplayName("GET /catalog returns game with generated UUID")
    void getCatalog_returnsGameWithId() throws Exception {
        // given
        String fixedId = "550e8400-e29b-41d4-a716-446655440000";
        CanonicalGame game = new CanonicalGame.Builder("Test Game")
                .setId(fixedId)
                .build();
        when(catalogService.getAllGames()).thenReturn(List.of(game));

        // when/then
        mockMvc.perform(get("/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is("550e8400-e29b-41d4-a716-446655440000")));
    }

    private CanonicalGame createGame(String name, int appId) {
        return new CanonicalGame.Builder(name)
                .setThumbnailUrl(String.format("https://steamcdn-a.akamaihd.net/steam/apps/%d/header.jpg", appId))
                .build();
    }
}

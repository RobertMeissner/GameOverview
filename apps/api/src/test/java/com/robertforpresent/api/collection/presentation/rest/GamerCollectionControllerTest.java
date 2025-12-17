package com.robertforpresent.api.collection.presentation.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.robertforpresent.api.collection.application.dto.CollectionGameView;
import com.robertforpresent.api.collection.application.service.GamerCollectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * API integration tests for GamerCollectionController.
 *
 * <p>Tests the user collection endpoints: listing, top games, and flag updates.</p>
 */
@WebMvcTest(GamerCollectionController.class)
class GamerCollectionControllerTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GAME_ID_1 = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID GAME_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GamerCollectionService collectionService;

    @MockitoBean
    private TopRankedMapper topRankedMapper;

    @Nested
    @DisplayName("GET /collection")
    class GetCollectionTests {

        @Test
        @DisplayName("returns user's game collection")
        void returnsUserGameCollection() throws Exception {
            // given
            List<CollectionGameView> collection = List.of(
                    createGameView(GAME_ID_1, "Stardew Valley", 0.95f, false, false, false),
                    createGameView(GAME_ID_2, "Half-Life 2", 0.92f, true, false, false)
            );
            when(collectionService.getCollection(TEST_USER_ID)).thenReturn(collection);

            // when/then
            mockMvc.perform(get("/collection")
                            .param("userId", TEST_USER_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType("application/json"))
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].name", is("Stardew Valley")))
                    .andExpect(jsonPath("$[1].name", is("Half-Life 2")));
        }

        @Test
        @DisplayName("returns empty list when user has no games")
        void returnsEmptyList_whenUserHasNoGames() throws Exception {
            // given
            when(collectionService.getCollection(TEST_USER_ID)).thenReturn(Collections.emptyList());

            // when/then
            mockMvc.perform(get("/collection")
                            .param("userId", TEST_USER_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("returns games with user flags")
        void returnsGamesWithUserFlags() throws Exception {
            // given
            CollectionGameView playedGame = createGameView(GAME_ID_1, "Played Game", 0.8f, true, false, false);
            CollectionGameView hiddenGame = createGameView(GAME_ID_2, "Hidden Game", 0.7f, false, true, false);
            when(collectionService.getCollection(TEST_USER_ID)).thenReturn(List.of(playedGame, hiddenGame));

            // when/then
            mockMvc.perform(get("/collection")
                            .param("userId", TEST_USER_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].markedAsPlayed", is(true)))
                    .andExpect(jsonPath("$[0].markedAsHidden", is(false)))
                    .andExpect(jsonPath("$[1].markedAsPlayed", is(false)))
                    .andExpect(jsonPath("$[1].markedAsHidden", is(true)));
        }

        @Test
        @DisplayName("requires userId parameter")
        void requiresUserIdParameter() throws Exception {
            // when/then
            mockMvc.perform(get("/collection"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /collection/top")
    class GetTopGamesTests {

        @Test
        @DisplayName("returns top 3 games mapped to DTOs")
        void returnsTop3GamesMappedToDtos() throws Exception {
            // given
            List<CollectionGameView> topGames = List.of(
                    createGameView(GAME_ID_1, "Best Game", 0.99f, false, false, false),
                    createGameView(GAME_ID_2, "Second Best", 0.95f, false, false, false)
            );
            when(collectionService.getTop3(TEST_USER_ID)).thenReturn(topGames);

            TopRankedDTO dto1 = new TopRankedDTO(GAME_ID_1, "Best Game", 0.99f, "thumb1.jpg");
            TopRankedDTO dto2 = new TopRankedDTO(GAME_ID_2, "Second Best", 0.95f, "thumb2.jpg");
            when(topRankedMapper.toDto(topGames.get(0))).thenReturn(dto1);
            when(topRankedMapper.toDto(topGames.get(1))).thenReturn(dto2);

            // when/then
            mockMvc.perform(get("/collection/top")
                            .param("userId", TEST_USER_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].name", is("Best Game")))
                    .andExpect(jsonPath("$[0].rating", is(0.99)));
        }

        @Test
        @DisplayName("returns empty list when no games")
        void returnsEmptyList_whenNoGames() throws Exception {
            // given
            when(collectionService.getTop3(TEST_USER_ID)).thenReturn(Collections.emptyList());

            // when/then
            mockMvc.perform(get("/collection/top")
                            .param("userId", TEST_USER_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("PATCH /collection/games/{gameId}")
    class UpdateFlagsTests {

        @Test
        @DisplayName("updates game flags successfully")
        void updatesGameFlagsSuccessfully() throws Exception {
            // given
            UpdateFlagsRequest request = new UpdateFlagsRequest(true, false, true);
            CollectionGameView updatedGame = createGameView(GAME_ID_1, "Test Game", 0.8f, true, false, true);
            when(collectionService.updateFlags(eq(TEST_USER_ID), eq(GAME_ID_1), any(UpdateFlagsRequest.class)))
                    .thenReturn(updatedGame);

            // when/then
            mockMvc.perform(patch("/collection/games/{gameId}", GAME_ID_1)
                            .param("userId", TEST_USER_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.markedAsPlayed", is(true)))
                    .andExpect(jsonPath("$.markedAsHidden", is(false)))
                    .andExpect(jsonPath("$.markedForLater", is(true)));
        }

        @Test
        @DisplayName("marks game as played")
        void marksGameAsPlayed() throws Exception {
            // given
            UpdateFlagsRequest request = new UpdateFlagsRequest(true, false, false);
            CollectionGameView updatedGame = createGameView(GAME_ID_1, "Test Game", 0.8f, true, false, false);
            when(collectionService.updateFlags(eq(TEST_USER_ID), eq(GAME_ID_1), any(UpdateFlagsRequest.class)))
                    .thenReturn(updatedGame);

            // when/then
            mockMvc.perform(patch("/collection/games/{gameId}", GAME_ID_1)
                            .param("userId", TEST_USER_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.markedAsPlayed", is(true)));
        }

        @Test
        @DisplayName("marks game as hidden")
        void marksGameAsHidden() throws Exception {
            // given
            UpdateFlagsRequest request = new UpdateFlagsRequest(false, true, false);
            CollectionGameView updatedGame = createGameView(GAME_ID_1, "Test Game", 0.8f, false, true, false);
            when(collectionService.updateFlags(eq(TEST_USER_ID), eq(GAME_ID_1), any(UpdateFlagsRequest.class)))
                    .thenReturn(updatedGame);

            // when/then
            mockMvc.perform(patch("/collection/games/{gameId}", GAME_ID_1)
                            .param("userId", TEST_USER_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.markedAsHidden", is(true)));
        }

        @Test
        @DisplayName("requires request body")
        void requiresRequestBody() throws Exception {
            // when/then
            mockMvc.perform(patch("/collection/games/{gameId}", GAME_ID_1)
                            .param("userId", TEST_USER_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }

    private CollectionGameView createGameView(UUID id, String name, float rating,
                                               boolean played, boolean hidden, boolean later) {
        return new CollectionGameView(id, name, "https://example.com/" + id + ".jpg", rating, played, hidden, later);
    }
}

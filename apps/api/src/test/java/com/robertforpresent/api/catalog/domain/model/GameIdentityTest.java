package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for GameIdentity value object.
 */
class GameIdentityTest {

    @Nested
    @DisplayName("Record construction")
    class ConstructionTests {

        @Test
        @DisplayName("creates identity with all fields")
        void createsIdentityWithAllFields() {
            // given
            UUID id = UUID.randomUUID();
            String name = "Stardew Valley";
            String slug = "stardew-valley";

            // when
            var identity = new GameIdentity(id, name, slug);

            // then
            assertEquals(id, identity.id());
            assertEquals(name, identity.name());
            assertEquals(slug, identity.slug());
        }

        @Test
        @DisplayName("allows null slug")
        void allowsNullSlug() {
            // given
            UUID id = UUID.randomUUID();
            String name = "Test Game";

            // when
            var identity = new GameIdentity(id, name, null);

            // then
            assertEquals(id, identity.id());
            assertEquals(name, identity.name());
            assertNull(identity.slug());
        }

        @Test
        @DisplayName("allows null name")
        void allowsNullName() {
            // given
            UUID id = UUID.randomUUID();

            // when
            var identity = new GameIdentity(id, null, "slug");

            // then
            assertNull(identity.name());
        }
    }

    @Nested
    @DisplayName("Accessors")
    class AccessorTests {

        @Test
        @DisplayName("id() returns the UUID")
        void idReturnsUuid() {
            // given
            UUID expectedId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
            var identity = new GameIdentity(expectedId, "Test", "test");

            // then
            assertEquals(expectedId, identity.id());
        }

        @Test
        @DisplayName("name() returns the name")
        void nameReturnsName() {
            // given
            var identity = new GameIdentity(UUID.randomUUID(), "Hollow Knight", "hollow-knight");

            // then
            assertEquals("Hollow Knight", identity.name());
        }

        @Test
        @DisplayName("slug() returns the slug")
        void slugReturnsSlug() {
            // given
            var identity = new GameIdentity(UUID.randomUUID(), "Hollow Knight", "hollow-knight");

            // then
            assertEquals("hollow-knight", identity.slug());
        }
    }

    @Nested
    @DisplayName("Equality and hashCode")
    class EqualityTests {

        @Test
        @DisplayName("equal identities are equal")
        void equalIdentitiesAreEqual() {
            // given
            UUID id = UUID.randomUUID();
            var identity1 = new GameIdentity(id, "Game", "game");
            var identity2 = new GameIdentity(id, "Game", "game");

            // then
            assertEquals(identity1, identity2);
            assertEquals(identity1.hashCode(), identity2.hashCode());
        }

        @Test
        @DisplayName("different IDs make identities unequal")
        void differentIdsMakeIdentitiesUnequal() {
            // given
            var identity1 = new GameIdentity(UUID.randomUUID(), "Game", "game");
            var identity2 = new GameIdentity(UUID.randomUUID(), "Game", "game");

            // then
            assertNotEquals(identity1, identity2);
        }

        @Test
        @DisplayName("different names make identities unequal")
        void differentNamesMakeIdentitiesUnequal() {
            // given
            UUID id = UUID.randomUUID();
            var identity1 = new GameIdentity(id, "Game 1", "game");
            var identity2 = new GameIdentity(id, "Game 2", "game");

            // then
            assertNotEquals(identity1, identity2);
        }

        @Test
        @DisplayName("different slugs make identities unequal")
        void differentSlugsMakeIdentitiesUnequal() {
            // given
            UUID id = UUID.randomUUID();
            var identity1 = new GameIdentity(id, "Game", "game-1");
            var identity2 = new GameIdentity(id, "Game", "game-2");

            // then
            assertNotEquals(identity1, identity2);
        }
    }

    @Nested
    @DisplayName("Use cases")
    class UseCaseTests {

        @Test
        @DisplayName("works with typical game names")
        void worksWithTypicalGameNames() {
            // given
            UUID id = UUID.randomUUID();

            // when
            var identity = new GameIdentity(id, "The Legend of Zelda: Breath of the Wild", "legend-of-zelda-breath-of-the-wild");

            // then
            assertEquals("The Legend of Zelda: Breath of the Wild", identity.name());
            assertEquals("legend-of-zelda-breath-of-the-wild", identity.slug());
        }

        @Test
        @DisplayName("handles special characters in name")
        void handlesSpecialCharactersInName() {
            // given
            UUID id = UUID.randomUUID();

            // when
            var identity = new GameIdentity(id, "SUPERHOT: MIND CONTROL DELETE", "superhot-mind-control-delete");

            // then
            assertEquals("SUPERHOT: MIND CONTROL DELETE", identity.name());
        }

        @Test
        @DisplayName("handles unicode characters in name")
        void handlesUnicodeCharactersInName() {
            // given
            UUID id = UUID.randomUUID();

            // when
            var identity = new GameIdentity(id, "NieR: Automata", "nier-automata");

            // then
            assertEquals("NieR: Automata", identity.name());
        }
    }
}

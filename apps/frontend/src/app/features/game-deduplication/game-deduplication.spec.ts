import {describe, it, expect, beforeEach} from 'vitest';
import {GameDeduplication} from './game-deduplication';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';

describe('GameDeduplication', () => {
  let component: GameDeduplication;

  const createGame = (overrides: Partial<AdminGameEntry> = {}): AdminGameEntry => ({
    id: 'game-' + Math.random().toString(36).substring(7),
    name: 'Test Game',
    thumbnailUrl: 'http://example.com/thumb.jpg',
    rating: 80,
    markedAsPlayed: false,
    markedAsHidden: false,
    markedForLater: false,
    steamAppId: null,
    steamName: null,
    steamLink: null,
    gogId: null,
    gogName: null,
    gogLink: null,
    metacriticScore: null,
    metacriticName: null,
    metacriticLink: null,
    ...overrides,
  });

  beforeEach(() => {
    // Create component instance without Angular DI for unit testing logic
    component = new GameDeduplication();
  });

  describe('normalizeName', () => {
    // Access private method via any cast for testing
    const normalize = (name: string) => (component as any).normalizeName(name);

    it('converts to lowercase', () => {
      expect(normalize('Stardew Valley')).toBe('stardew valley');
    });

    it('removes special characters', () => {
      expect(normalize("Baldur's Gate 3")).toBe('baldurs gate 3');
    });

    it('normalizes whitespace', () => {
      expect(normalize('The   Witcher   3')).toBe('the witcher 3');
    });

    it('trims leading and trailing spaces', () => {
      expect(normalize('  Hollow Knight  ')).toBe('hollow knight');
    });

    it('handles games with colons', () => {
      expect(normalize('Disco Elysium: The Final Cut')).toBe('disco elysium the final cut');
    });
  });

  describe('levenshteinDistance', () => {
    const distance = (s1: string, s2: string) => (component as any).levenshteinDistance(s1, s2);

    it('returns 0 for identical strings', () => {
      expect(distance('hello', 'hello')).toBe(0);
    });

    it('returns string length for empty comparison', () => {
      expect(distance('hello', '')).toBe(5);
      expect(distance('', 'world')).toBe(5);
    });

    it('calculates single character difference', () => {
      expect(distance('cat', 'bat')).toBe(1);
    });

    it('calculates insertions', () => {
      expect(distance('cat', 'cats')).toBe(1);
    });

    it('calculates deletions', () => {
      expect(distance('cats', 'cat')).toBe(1);
    });

    it('calculates complex differences', () => {
      expect(distance('kitten', 'sitting')).toBe(3);
    });
  });

  describe('calculateNameSimilarity', () => {
    const similarity = (n1: string, n2: string) => (component as any).calculateNameSimilarity(n1, n2);

    it('returns 1.0 for identical names', () => {
      expect(similarity('Stardew Valley', 'Stardew Valley')).toBe(1.0);
    });

    it('returns 1.0 for case-insensitive matches', () => {
      expect(similarity('STARDEW VALLEY', 'stardew valley')).toBe(1.0);
    });

    it('returns 1.0 when only special characters differ', () => {
      expect(similarity("Baldur's Gate 3", 'Baldurs Gate 3')).toBe(1.0);
    });

    it('returns high similarity for minor differences', () => {
      const sim = similarity('The Witcher 3', 'The Witcher III');
      expect(sim).toBeGreaterThan(0.8);
    });

    it('returns low similarity for different names', () => {
      const sim = similarity('Stardew Valley', 'Hollow Knight');
      expect(sim).toBeLessThan(0.5);
    });

    it('returns 0 for empty string comparison', () => {
      expect(similarity('', 'Game')).toBe(0);
      expect(similarity('Game', '')).toBe(0);
    });
  });

  describe('checkMatch', () => {
    const checkMatch = (g1: AdminGameEntry, g2: AdminGameEntry) => (component as any).checkMatch(g1, g2);

    it('matches games with same Steam App ID', () => {
      const game1 = createGame({steamAppId: 413150});
      const game2 = createGame({steamAppId: 413150, name: 'Different Name'});

      const result = checkMatch(game1, game2);

      expect(result.isMatch).toBe(true);
      expect(result.reasons).toContain('Same Steam App ID');
      expect(result.similarity).toBe(1.0);
    });

    it('matches games with same GoG ID', () => {
      const game1 = createGame({gogId: 123456});
      const game2 = createGame({gogId: 123456, name: 'Different Name'});

      const result = checkMatch(game1, game2);

      expect(result.isMatch).toBe(true);
      expect(result.reasons).toContain('Same GoG ID');
      expect(result.similarity).toBe(1.0);
    });

    it('matches games with similar names', () => {
      const game1 = createGame({name: 'Stardew Valley'});
      const game2 = createGame({name: 'Stardew valley'}); // case difference

      const result = checkMatch(game1, game2);

      expect(result.isMatch).toBe(true);
      expect(result.reasons.some((r: string) => r.includes('Similar name'))).toBe(true);
    });

    it('does not match games with different names and no IDs', () => {
      const game1 = createGame({name: 'Hollow Knight'});
      const game2 = createGame({name: 'Stardew Valley'});

      const result = checkMatch(game1, game2);

      expect(result.isMatch).toBe(false);
    });

    it('does not match when Steam IDs are null', () => {
      const game1 = createGame({steamAppId: null});
      const game2 = createGame({steamAppId: null, name: 'Different Game'});

      const result = checkMatch(game1, game2);

      expect(result.reasons).not.toContain('Same Steam App ID');
    });

    it('does not match when Steam IDs are different', () => {
      const game1 = createGame({steamAppId: 123});
      const game2 = createGame({steamAppId: 456, name: 'Different Game'});

      const result = checkMatch(game1, game2);

      expect(result.reasons).not.toContain('Same Steam App ID');
    });

    it('matches when Steam name matches other game canonical name', () => {
      const game1 = createGame({name: 'Stardew Valley', steamName: 'Stardew Valley'});
      const game2 = createGame({name: 'Stardew Valley Steam Edition'});

      const result = checkMatch(game1, game2);

      // Should find some match due to name similarity
      expect(result.similarity).toBeGreaterThan(0);
    });
  });

  describe('findDuplicates', () => {
    it('groups games with matching Steam IDs', () => {
      const games = [
        createGame({id: 'g1', name: 'Game A', steamAppId: 100}),
        createGame({id: 'g2', name: 'Game B', steamAppId: 100}),
        createGame({id: 'g3', name: 'Game C', steamAppId: 200}),
      ];

      component.games.set(games);
      component.findDuplicates();

      const groups = component.duplicateGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].games.length).toBe(2);
      expect(groups[0].games.map(g => g.id)).toContain('g1');
      expect(groups[0].games.map(g => g.id)).toContain('g2');
    });

    it('groups games with identical names', () => {
      const games = [
        createGame({id: 'g1', name: 'Duplicate Game'}),
        createGame({id: 'g2', name: 'Duplicate Game'}),
        createGame({id: 'g3', name: 'Unique Game'}),
      ];

      component.games.set(games);
      component.findDuplicates();

      const groups = component.duplicateGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].games.length).toBe(2);
    });

    it('sorts groups by similarity descending', () => {
      const games = [
        createGame({id: 'g1', name: 'Game AAA', steamAppId: 100}),
        createGame({id: 'g2', name: 'Game AAB', steamAppId: 100}), // exact ID match = 1.0
        createGame({id: 'g3', name: 'Similar Name'}),
        createGame({id: 'g4', name: 'Similar Name'}), // exact name match = 1.0
      ];

      component.games.set(games);
      component.findDuplicates();

      const groups = component.duplicateGroups();
      expect(groups.length).toBe(2);
      // Both should have similarity 1.0
      expect(groups[0].similarity).toBe(1.0);
      expect(groups[1].similarity).toBe(1.0);
    });

    it('returns empty array when no duplicates found', () => {
      const games = [
        createGame({id: 'g1', name: 'Game One'}),
        createGame({id: 'g2', name: 'Game Two'}),
        createGame({id: 'g3', name: 'Game Three'}),
      ];

      component.games.set(games);
      component.findDuplicates();

      const groups = component.duplicateGroups();
      expect(groups.length).toBe(0);
    });

    it('handles empty games list', () => {
      component.games.set([]);
      component.findDuplicates();

      expect(component.duplicateGroups().length).toBe(0);
    });
  });

  describe('filteredGroups', () => {
    beforeEach(() => {
      const groups = [
        {
          games: [createGame(), createGame()],
          matchReasons: ['Same Steam App ID'],
          similarity: 1.0,
        },
        {
          games: [createGame(), createGame()],
          matchReasons: ['Same GoG ID'],
          similarity: 1.0,
        },
        {
          games: [createGame(), createGame()],
          matchReasons: ['Similar name (98%)'],
          similarity: 0.98,
        },
      ];
      component.duplicateGroups.set(groups);
    });

    it('shows all groups when all filters enabled', () => {
      component.showNameMatches.set(true);
      component.showSteamIdMatches.set(true);
      component.showGogIdMatches.set(true);

      expect(component.filteredGroups().length).toBe(3);
    });

    it('filters to only Steam matches', () => {
      component.showNameMatches.set(false);
      component.showSteamIdMatches.set(true);
      component.showGogIdMatches.set(false);

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].matchReasons).toContain('Same Steam App ID');
    });

    it('filters to only name matches', () => {
      component.showNameMatches.set(true);
      component.showSteamIdMatches.set(false);
      component.showGogIdMatches.set(false);

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].matchReasons[0]).toContain('name');
    });

    it('returns empty when all filters disabled', () => {
      component.showNameMatches.set(false);
      component.showSteamIdMatches.set(false);
      component.showGogIdMatches.set(false);

      expect(component.filteredGroups().length).toBe(0);
    });
  });

  describe('selectGroup', () => {
    it('sets selected group and targets highest rated game', () => {
      const games = [
        createGame({id: 'g1', rating: 70}),
        createGame({id: 'g2', rating: 95}),
        createGame({id: 'g3', rating: 80}),
      ];
      const group = {games, matchReasons: ['Test'], similarity: 1.0};

      component.selectGroup(group);

      expect(component.selectedGroup()).toBe(group);
      expect(component.targetGame()?.id).toBe('g2'); // Highest rated
    });
  });

  describe('getMatchBadgeClass', () => {
    it('returns steam class for Steam matches', () => {
      expect(component.getMatchBadgeClass('Same Steam App ID')).toBe('badge-steam');
    });

    it('returns gog class for GoG matches', () => {
      expect(component.getMatchBadgeClass('Same GoG ID')).toBe('badge-gog');
    });

    it('returns name class for name matches', () => {
      expect(component.getMatchBadgeClass('Similar name (98%)')).toBe('badge-name');
    });
  });
});

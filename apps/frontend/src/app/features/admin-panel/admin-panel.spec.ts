import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, vi, MockedObject, expect } from 'vitest';

import { AdminPanel } from './admin-panel';
import { GamesService } from '../../services/games.service';
import { AdminGameEntry } from '../../domain/entities/AdminGameEntry';

/**
 * Unit tests for AdminPanel component.
 *
 * Tests filtering, sorting, editing store data, and service interactions.
 */
describe('AdminPanel', () => {
  let component: AdminPanel;
  let fixture: ComponentFixture<AdminPanel>;
  let gamesServiceSpy: MockedObject<GamesService>;

  // Test data factory
  const createMockAdminGame = (overrides: Partial<AdminGameEntry> = {}): AdminGameEntry => ({
    id: 'test-id-1',
    name: 'Test Game',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    rating: 0.85,
    markedAsPlayed: false,
    markedAsHidden: false,
    markedForLater: false,
    steamAppId: 413150,
    steamName: 'Test Game',
    steamLink: 'https://store.steampowered.com/app/413150',
    gogId: null,
    gogName: null,
    gogLink: null,
    metacriticScore: null,
    metacriticName: null,
    metacriticLink: null,
    ...overrides,
  });

  beforeEach(async () => {
    const spy = {
      getAdminGames: vi.fn().mockReturnValue(of([])),
      updateCatalogValues: vi.fn().mockReturnValue(of(undefined)),
      updateGameFlags: vi.fn().mockReturnValue(of(createMockAdminGame())),
    };

    await TestBed.configureTestingModule({
      imports: [AdminPanel],
      providers: [{ provide: GamesService, useValue: spy }],
    }).compileComponents();

    gamesServiceSpy = TestBed.inject(GamesService) as MockedObject<GamesService>;
    fixture = TestBed.createComponent(AdminPanel);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call getAdminGames on init', () => {
      // when
      fixture.detectChanges();

      // then
      expect(gamesServiceSpy.getAdminGames).toHaveBeenCalledTimes(1);
    });

    it('should populate games signal with service response', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Game 1' }),
        createMockAdminGame({ id: '2', name: 'Game 2' }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(component.games()).toEqual(mockGames);
    });
  });

  describe('filtering', () => {
    it('should filter games with missing app ID', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Has App ID', steamAppId: 123 }),
        createMockAdminGame({ id: '2', name: 'Missing App ID', steamAppId: null }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.filterMissingAppId.set(true);

      // then
      const filtered = component.filteredAndSortedGames();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Missing App ID');
    });

    it('should filter games with name mismatch', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Test Game', steamName: 'Test Game' }),
        createMockAdminGame({ id: '2', name: 'Different Name', steamName: 'Steam Name' }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.filterNameMismatch.set(true);

      // then
      const filtered = component.filteredAndSortedGames();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Different Name');
    });

    it('should show all games when no filter is active', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1' }),
        createMockAdminGame({ id: '2' }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(component.filteredAndSortedGames().length).toBe(2);
    });
  });

  describe('sorting', () => {
    it('should sort by name ascending by default', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Zelda' }),
        createMockAdminGame({ id: '2', name: 'Asteroids' }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      const sorted = component.filteredAndSortedGames();
      expect(sorted[0].name).toBe('Asteroids');
      expect(sorted[1].name).toBe('Zelda');
    });

    it('should toggle sort direction when clicking same field', () => {
      // given
      expect(component.sortDirection()).toBe('asc');

      // when
      component.setSortField('name');

      // then
      expect(component.sortDirection()).toBe('desc');
    });

    it('should default to descending when sorting by rating', () => {
      // when
      component.setSortField('rating');

      // then
      expect(component.sortField()).toBe('rating');
      expect(component.sortDirection()).toBe('desc');
    });

    it('should sort by rating correctly', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Low Rated', rating: 0.50 }),
        createMockAdminGame({ id: '2', name: 'High Rated', rating: 0.95 }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.setSortField('rating');

      // then - rating sorts descending by default
      const sorted = component.filteredAndSortedGames();
      expect(sorted[0].name).toBe('High Rated');
      expect(sorted[1].name).toBe('Low Rated');
    });

    it('should sort by steamAppId correctly', async () => {
      // given
      const mockGames = [
        createMockAdminGame({ id: '1', name: 'Game 1', steamAppId: 500 }),
        createMockAdminGame({ id: '2', name: 'Game 2', steamAppId: 100 }),
        createMockAdminGame({ id: '3', name: 'Game 3', steamAppId: null }),
      ];
      gamesServiceSpy.getAdminGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.setSortField('steamAppId');

      // then - null treated as -1, ascending by default
      const sorted = component.filteredAndSortedGames();
      expect(sorted[0].steamAppId).toBe(null); // -1
      expect(sorted[1].steamAppId).toBe(100);
      expect(sorted[2].steamAppId).toBe(500);
    });
  });

  describe('editing', () => {
    it('should populate edit signals when starting edit', async () => {
      // given
      const game = createMockAdminGame({
        steamAppId: 413150,
        steamName: 'Stardew Valley',
        gogId: 123456,
        gogName: 'Stardew Valley GOG',
        metacriticScore: 89,
        metacriticName: 'stardew-valley',
      });

      // when
      component.startEdit(game);

      // then
      expect(component.editingGame()).toBe(game);
      expect(component.editSteamAppId()).toBe(413150);
      expect(component.editSteamName()).toBe('Stardew Valley');
      expect(component.editGogId()).toBe(123456);
      expect(component.editGogName()).toBe('Stardew Valley GOG');
      expect(component.editMetacriticScore()).toBe(89);
      expect(component.editMetacriticName()).toBe('stardew-valley');
    });

    it('should clear edit signals when canceling edit', () => {
      // given
      const game = createMockAdminGame();
      component.startEdit(game);

      // when
      component.cancelEdit();

      // then
      expect(component.editingGame()).toBe(null);
      expect(component.editSteamAppId()).toBe(null);
      expect(component.editSteamName()).toBe(null);
      expect(component.editGogId()).toBe(null);
      expect(component.editGogName()).toBe(null);
      expect(component.editMetacriticScore()).toBe(null);
      expect(component.editMetacriticName()).toBe(null);
    });

    it('should call updateCatalogValues with all store fields when saving', async () => {
      // given
      const game = createMockAdminGame({ id: 'game-123' });
      gamesServiceSpy.getAdminGames.mockReturnValue(of([game]));
      fixture.detectChanges();

      component.startEdit(game);
      component.editSteamAppId.set(999);
      component.editSteamName.set('New Steam Name');
      component.editGogId.set(888);
      component.editGogName.set('New GOG Name');
      component.editMetacriticScore.set(95);
      component.editMetacriticName.set('new-game');

      // when
      component.saveEdit();
      await fixture.whenStable();

      // then
      expect(gamesServiceSpy.updateCatalogValues).toHaveBeenCalledWith('game-123', {
        steamAppId: 999,
        steamName: 'New Steam Name',
        gogId: 888,
        gogName: 'New GOG Name',
        metacriticScore: 95,
        metacriticName: 'new-game',
      });
    });

    it('should reload games and cancel edit after successful save', async () => {
      // given
      const game = createMockAdminGame({ id: 'game-123' });
      gamesServiceSpy.getAdminGames.mockReturnValue(of([game]));
      fixture.detectChanges();

      component.startEdit(game);

      // when
      component.saveEdit();
      await fixture.whenStable();

      // then
      expect(gamesServiceSpy.getAdminGames).toHaveBeenCalledTimes(2); // once on init, once after save
      expect(component.editingGame()).toBe(null);
    });

    it('should not call service if no game is being edited', () => {
      // given
      component.editingGame.set(null);

      // when
      component.saveEdit();

      // then
      expect(gamesServiceSpy.updateCatalogValues).not.toHaveBeenCalled();
    });
  });

  describe('flag changes', () => {
    it('should call updateGameFlags when flag changes', () => {
      // given
      const game = createMockAdminGame({
        id: 'game-123',
        markedAsPlayed: true,
        markedAsHidden: false,
        markedForLater: true,
      });

      // when
      component.onFlagChange(game);

      // then
      expect(gamesServiceSpy.updateGameFlags).toHaveBeenCalledWith('game-123', {
        markedAsPlayed: true,
        markedAsHidden: false,
        markedForLater: true,
      });
    });
  });

  describe('error handling', () => {
    it('should handle getAdminGames error gracefully', async () => {
      // given
      const consoleSpy = vi.spyOn(console, 'error');
      gamesServiceSpy.getAdminGames.mockReturnValue(throwError(() => new Error('API Error')));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.games()).toEqual([]);
    });

    it('should handle updateCatalogValues error gracefully', async () => {
      // given
      const consoleSpy = vi.spyOn(console, 'error');
      const game = createMockAdminGame();
      gamesServiceSpy.getAdminGames.mockReturnValue(of([game]));
      gamesServiceSpy.updateCatalogValues.mockReturnValue(throwError(() => new Error('Update failed')));

      fixture.detectChanges();
      component.startEdit(game);

      // when
      component.saveEdit();
      await fixture.whenStable();

      // then
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});

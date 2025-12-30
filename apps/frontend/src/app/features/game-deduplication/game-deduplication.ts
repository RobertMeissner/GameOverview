import {Component, computed, inject, OnInit, signal, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CatalogDuplicateGroup, CatalogGameEntry, GamesService} from '../../services/games.service';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

export interface DuplicateGroup {
  games: AdminGameEntry[];
  matchReasons: string[];
  similarity: number;
}

export type DeduplicationMode = 'collection' | 'catalog';

// Pre-computed game data for faster comparisons
interface GameIndex {
  game: AdminGameEntry;
  normalizedName: string;
  normalizedSteamName: string | null;
}

@Component({
  selector: 'app-game-deduplication',
  imports: [CommonModule, FormsModule],
  templateUrl: './game-deduplication.html',
  styleUrl: './game-deduplication.scss',
})
export class GameDeduplication implements OnInit, OnDestroy {
  private gamesService = inject(GamesService);
  private destroy$ = new Subject<void>();

  // Debounced threshold changes
  private thresholdChange$ = new Subject<number>();

  // Mode switch: 'collection' (user's games) or 'catalog' (all canonical games)
  mode = signal<DeduplicationMode>('catalog');

  games = signal<AdminGameEntry[]>([]);
  duplicateGroups = signal<DuplicateGroup[]>([]);
  loading = signal(false);
  merging = signal(false);
  selectedGroup = signal<DuplicateGroup | null>(null);
  targetGame = signal<AdminGameEntry | null>(null);

  // Catalog mode
  catalogDuplicates = signal<CatalogDuplicateGroup[]>([]);
  selectedCatalogGroup = signal<CatalogDuplicateGroup | null>(null);
  targetCatalogGame = signal<CatalogGameEntry | null>(null);

  // Configurable thresholds
  nameSimilarityThreshold = signal(0.95);
  minMatchCriteria = signal(1);

  // Filter options
  showNameMatches = signal(true);
  showSteamIdMatches = signal(true);
  showGogIdMatches = signal(true);

  // Cache for normalized names (cleared when games change)
  private gameIndex: GameIndex[] = [];

  filteredGroups = computed(() => {
    const groups = this.duplicateGroups();
    const showName = this.showNameMatches();
    const showSteam = this.showSteamIdMatches();
    const showGog = this.showGogIdMatches();

    return groups.filter(group => {
      const reasons = group.matchReasons;
      return (showName && reasons.some(r => r.includes('name'))) ||
             (showSteam && reasons.some(r => r.includes('Steam'))) ||
             (showGog && reasons.some(r => r.includes('GoG')));
    });
  });

  ngOnInit(): void {
    // Setup debounced threshold change handler (300ms delay)
    this.thresholdChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(threshold => {
      this.nameSimilarityThreshold.set(threshold);
      this.findDuplicatesOptimized();
    });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Called by the template on slider change - debounced
  onThresholdChange(value: number): void {
    this.thresholdChange$.next(value);
  }

  setMode(mode: DeduplicationMode): void {
    this.mode.set(mode);
    this.loadData();
  }

  private loadData(): void {
    if (this.mode() === 'catalog') {
      this.loadCatalogDuplicates();
    } else {
      this.loadGames();
    }
  }

  private loadCatalogDuplicates(): void {
    this.loading.set(true);
    this.gamesService.getCatalogDuplicates().subscribe({
      next: duplicates => {
        console.log(`[Dedup] Found ${duplicates.length} catalog duplicate groups`);
        this.catalogDuplicates.set(duplicates);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load catalog duplicates:', err);
        this.loading.set(false);
      }
    });
  }

  private loadGames(): void {
    this.loading.set(true);
    this.gamesService.getAdminGames().subscribe({
      next: games => {
        this.games.set(games);
        this.buildGameIndex(games);
        this.findDuplicatesOptimized();
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load games:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Build an index of games with pre-computed normalized names.
   * This avoids recalculating normalized names during O(n²) comparison.
   */
  private buildGameIndex(games: AdminGameEntry[]): void {
    console.time('[Dedup] Building game index');
    this.gameIndex = games.map(game => ({
      game,
      normalizedName: this.normalizeName(game.name),
      normalizedSteamName: game.steamName ? this.normalizeName(game.steamName) : null
    }));
    console.timeEnd('[Dedup] Building game index');
  }

  /**
   * Optimized duplicate detection algorithm:
   * 1. First pass: Group by exact normalized name (O(n) using Map)
   * 2. Second pass: Group by Steam/GoG IDs (O(n) using Maps)
   * 3. Third pass: Only run expensive Levenshtein for potential near-matches
   */
  findDuplicatesOptimized(): void {
    const startTime = performance.now();
    const allGames = this.gameIndex;
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    console.log(`[Dedup] Finding duplicates among ${allGames.length} games (optimized)`);

    // Phase 1: Group by exact normalized name (O(n))
    const nameGroups = new Map<string, GameIndex[]>();
    for (const gi of allGames) {
      if (!nameGroups.has(gi.normalizedName)) {
        nameGroups.set(gi.normalizedName, []);
      }
      nameGroups.get(gi.normalizedName)!.push(gi);
    }

    // Phase 2: Group by Steam App ID (O(n))
    const steamGroups = new Map<number, GameIndex[]>();
    for (const gi of allGames) {
      if (gi.game.steamAppId) {
        if (!steamGroups.has(gi.game.steamAppId)) {
          steamGroups.set(gi.game.steamAppId, []);
        }
        steamGroups.get(gi.game.steamAppId)!.push(gi);
      }
    }

    // Phase 3: Group by GoG ID (O(n))
    const gogGroups = new Map<number, GameIndex[]>();
    for (const gi of allGames) {
      if (gi.game.gogId) {
        if (!gogGroups.has(gi.game.gogId)) {
          gogGroups.set(gi.game.gogId, []);
        }
        gogGroups.get(gi.game.gogId)!.push(gi);
      }
    }

    // Collect exact name matches
    for (const [name, gameIndexes] of nameGroups) {
      if (gameIndexes.length > 1) {
        const ids = gameIndexes.map(gi => gi.game.id);
        if (ids.some(id => processed.has(id))) continue;

        ids.forEach(id => processed.add(id));
        groups.push({
          games: gameIndexes.map(gi => gi.game),
          matchReasons: ['Similar name (100%)'],
          similarity: 1.0
        });
      }
    }

    // Collect Steam ID matches (if not already processed)
    for (const [steamId, gameIndexes] of steamGroups) {
      if (gameIndexes.length > 1) {
        const unprocessed = gameIndexes.filter(gi => !processed.has(gi.game.id));
        if (unprocessed.length > 1) {
          unprocessed.forEach(gi => processed.add(gi.game.id));
          groups.push({
            games: unprocessed.map(gi => gi.game),
            matchReasons: ['Same Steam App ID'],
            similarity: 1.0
          });
        }
      }
    }

    // Collect GoG ID matches (if not already processed)
    for (const [gogId, gameIndexes] of gogGroups) {
      if (gameIndexes.length > 1) {
        const unprocessed = gameIndexes.filter(gi => !processed.has(gi.game.id));
        if (unprocessed.length > 1) {
          unprocessed.forEach(gi => processed.add(gi.game.id));
          groups.push({
            games: unprocessed.map(gi => gi.game),
            matchReasons: ['Same GoG ID'],
            similarity: 1.0
          });
        }
      }
    }

    // Phase 4: Fuzzy name matching for unprocessed games (only if threshold < 1.0)
    const threshold = this.nameSimilarityThreshold();
    if (threshold < 1.0) {
      const unprocessedGames = allGames.filter(gi => !processed.has(gi.game.id));
      console.log(`[Dedup] Running fuzzy matching on ${unprocessedGames.length} remaining games`);

      // Group by first 3 characters for blocking (reduces comparisons)
      const blocks = new Map<string, GameIndex[]>();
      for (const gi of unprocessedGames) {
        const prefix = gi.normalizedName.substring(0, 3);
        if (!blocks.has(prefix)) {
          blocks.set(prefix, []);
        }
        blocks.get(prefix)!.push(gi);
      }

      // Only compare within blocks (games that share first 3 chars)
      for (const [_prefix, blockGames] of blocks) {
        if (blockGames.length < 2) continue;

        for (let i = 0; i < blockGames.length; i++) {
          const gi1 = blockGames[i];
          if (processed.has(gi1.game.id)) continue;

          const matches: AdminGameEntry[] = [gi1.game];
          const matchReasons: Set<string> = new Set();
          let maxSimilarity = 0;

          for (let j = i + 1; j < blockGames.length; j++) {
            const gi2 = blockGames[j];
            if (processed.has(gi2.game.id)) continue;

            const {isMatch, reasons, similarity} = this.checkMatchOptimized(gi1, gi2);
            if (isMatch) {
              matches.push(gi2.game);
              reasons.forEach(r => matchReasons.add(r));
              maxSimilarity = Math.max(maxSimilarity, similarity);
            }
          }

          if (matches.length > 1) {
            matches.forEach(g => processed.add(g.id));
            groups.push({
              games: matches,
              matchReasons: Array.from(matchReasons),
              similarity: maxSimilarity
            });
          }
        }
      }
    }

    const elapsed = performance.now() - startTime;
    console.log(`[Dedup] Total groups found: ${groups.length} in ${elapsed.toFixed(1)}ms`);

    // Sort by similarity descending
    groups.sort((a, b) => b.similarity - a.similarity);
    this.duplicateGroups.set(groups);
  }

  // Keep old method name for backwards compatibility with template
  findDuplicates(): void {
    this.findDuplicatesOptimized();
  }

  private checkMatchOptimized(gi1: GameIndex, gi2: GameIndex): {isMatch: boolean; reasons: string[]; similarity: number} {
    const reasons: string[] = [];
    let similarity = 0;

    // Check Steam App ID match
    if (gi1.game.steamAppId && gi2.game.steamAppId && gi1.game.steamAppId === gi2.game.steamAppId) {
      reasons.push('Same Steam App ID');
      similarity = Math.max(similarity, 1.0);
    }

    // Check GoG ID match
    if (gi1.game.gogId && gi2.game.gogId && gi1.game.gogId === gi2.game.gogId) {
      reasons.push('Same GoG ID');
      similarity = Math.max(similarity, 1.0);
    }

    // Check name similarity using pre-computed normalized names
    const nameSim = this.calculateNameSimilarityOptimized(gi1.normalizedName, gi2.normalizedName);
    if (nameSim >= this.nameSimilarityThreshold()) {
      reasons.push(`Similar name (${Math.round(nameSim * 100)}%)`);
      similarity = Math.max(similarity, nameSim);
    }

    // Check steam name vs canonical name cross-match
    if (gi1.normalizedSteamName && this.calculateNameSimilarityOptimized(gi1.normalizedSteamName, gi2.normalizedName) >= 0.9) {
      reasons.push('Steam name matches other game');
      similarity = Math.max(similarity, 0.9);
    }
    if (gi2.normalizedSteamName && this.calculateNameSimilarityOptimized(gi2.normalizedSteamName, gi1.normalizedName) >= 0.9) {
      reasons.push('Steam name matches other game');
      similarity = Math.max(similarity, 0.9);
    }

    return {
      isMatch: reasons.length >= this.minMatchCriteria(),
      reasons,
      similarity
    };
  }

  private checkMatch(game1: AdminGameEntry, game2: AdminGameEntry): {isMatch: boolean; reasons: string[]; similarity: number} {
    const reasons: string[] = [];
    let similarity = 0;

    // Check Steam App ID match
    if (game1.steamAppId && game2.steamAppId && game1.steamAppId === game2.steamAppId) {
      reasons.push('Same Steam App ID');
      similarity = Math.max(similarity, 1.0);
    }

    // Check GoG ID match
    if (game1.gogId && game2.gogId && game1.gogId === game2.gogId) {
      reasons.push('Same GoG ID');
      similarity = Math.max(similarity, 1.0);
    }

    // Check name similarity
    const nameSim = this.calculateNameSimilarity(game1.name, game2.name);
    if (nameSim >= this.nameSimilarityThreshold()) {
      reasons.push(`Similar name (${Math.round(nameSim * 100)}%)`);
      similarity = Math.max(similarity, nameSim);
    }

    // Check steam name vs canonical name cross-match
    if (game1.steamName && this.calculateNameSimilarity(game1.steamName, game2.name) >= 0.9) {
      reasons.push('Steam name matches other game');
      similarity = Math.max(similarity, 0.9);
    }
    if (game2.steamName && this.calculateNameSimilarity(game2.steamName, game1.name) >= 0.9) {
      reasons.push('Steam name matches other game');
      similarity = Math.max(similarity, 0.9);
    }

    return {
      isMatch: reasons.length >= this.minMatchCriteria(),
      reasons,
      similarity
    };
  }

  private calculateNameSimilarityOptimized(s1: string, s2: string): number {
    // Names are already normalized
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Early exit: if length difference is too large, similarity can't meet threshold
    const lenDiff = Math.abs(s1.length - s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    const threshold = this.nameSimilarityThreshold();
    if (lenDiff / maxLen > (1 - threshold)) {
      return 0; // Can't possibly meet threshold
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLen);
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const s1 = this.normalizeName(name1);
    const s2 = this.normalizeName(name2);

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLen);
  }

  private normalizeName(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    // Optimization: use single array instead of 2D matrix (space O(n) instead of O(m*n))
    let prev = new Array(n + 1);
    let curr = new Array(n + 1);

    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          curr[j] = prev[j - 1];
        } else {
          curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
      }
      [prev, curr] = [curr, prev];
    }

    return prev[n];
  }

  selectGroup(group: DuplicateGroup): void {
    this.selectedGroup.set(group);
    // Default to the game with highest rating as target
    const sorted = [...group.games].sort((a, b) => b.rating - a.rating);
    this.targetGame.set(sorted[0]);
  }

  selectTargetGame(game: AdminGameEntry): void {
    this.targetGame.set(game);
  }

  cancelMerge(): void {
    this.selectedGroup.set(null);
    this.targetGame.set(null);
  }

  confirmMerge(): void {
    const group = this.selectedGroup();
    const target = this.targetGame();
    if (!group || !target) return;

    const sourceIds = group.games
      .filter(g => g.id !== target.id)
      .map(g => g.id);

    if (sourceIds.length === 0) return;

    const sourceIdSet = new Set(sourceIds);

    this.merging.set(true);
    this.gamesService.mergeGames(target.id, sourceIds).subscribe({
      next: () => {
        this.merging.set(false);

        // Incremental update: Remove merged group and update local state
        // Remove the current group from duplicateGroups
        this.duplicateGroups.update(groups =>
          groups.filter(g => g !== group)
        );

        // Remove merged (source) games from the games list and index
        this.games.update(games =>
          games.filter(g => !sourceIdSet.has(g.id))
        );
        this.gameIndex = this.gameIndex.filter(gi => !sourceIdSet.has(gi.game.id));

        this.cancelMerge();
        console.log(`[Dedup] Incremental update: removed ${sourceIds.length} merged games`);
      },
      error: err => {
        console.error('Failed to merge games:', err);
        this.merging.set(false);
      }
    });
  }

  refreshDuplicates(): void {
    this.loadData();
  }

  // Catalog mode methods
  selectCatalogGroup(group: CatalogDuplicateGroup): void {
    this.selectedCatalogGroup.set(group);
    // Default to the game with highest rating as target
    const sorted = [...group.games].sort((a, b) => b.rating - a.rating);
    this.targetCatalogGame.set(sorted[0]);
  }

  selectTargetCatalogGame(game: CatalogGameEntry): void {
    this.targetCatalogGame.set(game);
  }

  cancelCatalogMerge(): void {
    this.selectedCatalogGroup.set(null);
    this.targetCatalogGame.set(null);
  }

  confirmCatalogMerge(): void {
    const group = this.selectedCatalogGroup();
    const target = this.targetCatalogGame();
    if (!group || !target) return;

    const sourceIds = group.games
      .filter(g => g.id !== target.id)
      .map(g => g.id);

    if (sourceIds.length === 0) return;

    this.merging.set(true);
    this.gamesService.mergeGames(target.id, sourceIds).subscribe({
      next: () => {
        this.merging.set(false);

        // Incremental update: Remove the merged group from catalogDuplicates
        this.catalogDuplicates.update(groups =>
          groups.filter(g => g !== group)
        );

        this.cancelCatalogMerge();
        console.log(`[Dedup] Incremental update: removed catalog duplicate group "${group.name}"`);
      },
      error: err => {
        console.error('Failed to merge catalog games:', err);
        this.merging.set(false);
      }
    });
  }

  autoMergeResult = signal<string | null>(null);

  autoMergeAll(): void {
    if (!confirm(`This will automatically merge all ${this.catalogDuplicates().length} duplicate groups. Continue?`)) {
      return;
    }

    this.merging.set(true);
    this.autoMergeResult.set(null);
    this.gamesService.autoMergeAllDuplicates().subscribe({
      next: result => {
        this.merging.set(false);
        this.autoMergeResult.set(result.message);
        this.loadCatalogDuplicates();
      },
      error: err => {
        console.error('Failed to auto-merge:', err);
        this.merging.set(false);
        this.autoMergeResult.set('Error: ' + (err.message || 'Failed to auto-merge'));
      }
    });
  }

  getMatchBadgeClass(reason: string): string {
    if (reason.includes('Steam')) return 'badge-steam';
    if (reason.includes('GoG')) return 'badge-gog';
    return 'badge-name';
  }
}

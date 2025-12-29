import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GamesService} from '../../services/games.service';
import {AdminGameEntry} from '../../domain/entities/AdminGameEntry';

export interface DuplicateGroup {
  games: AdminGameEntry[];
  matchReasons: string[];
  similarity: number;
}

@Component({
  selector: 'app-game-deduplication',
  imports: [CommonModule, FormsModule],
  templateUrl: './game-deduplication.html',
  styleUrl: './game-deduplication.scss',
})
export class GameDeduplication implements OnInit {
  private gamesService = inject(GamesService);

  games = signal<AdminGameEntry[]>([]);
  duplicateGroups = signal<DuplicateGroup[]>([]);
  loading = signal(false);
  merging = signal(false);
  selectedGroup = signal<DuplicateGroup | null>(null);
  targetGame = signal<AdminGameEntry | null>(null);

  // Configurable thresholds
  nameSimilarityThreshold = signal(0.95);
  minMatchCriteria = signal(1);

  // Filter options
  showNameMatches = signal(true);
  showSteamIdMatches = signal(true);
  showGogIdMatches = signal(true);

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
    this.loadGames();
  }

  private loadGames(): void {
    this.loading.set(true);
    this.gamesService.getAdminGames().subscribe({
      next: games => {
        this.games.set(games);
        this.findDuplicates();
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load games:', err);
        this.loading.set(false);
      }
    });
  }

  findDuplicates(): void {
    const allGames = this.games();
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    console.log(`[Dedup] Finding duplicates among ${allGames.length} games`);

    for (let i = 0; i < allGames.length; i++) {
      const game1 = allGames[i];
      if (processed.has(game1.id)) continue;

      const matches: AdminGameEntry[] = [game1];
      const matchReasons: Set<string> = new Set();
      let maxSimilarity = 0;

      for (let j = i + 1; j < allGames.length; j++) {
        const game2 = allGames[j];
        if (processed.has(game2.id)) continue;

        const {isMatch, reasons, similarity} = this.checkMatch(game1, game2);
        if (isMatch) {
          matches.push(game2);
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
        console.log(`[Dedup] Found group: ${matches.map(g => g.name).join(', ')} - ${Array.from(matchReasons).join(', ')}`);
      }
    }

    console.log(`[Dedup] Total groups found: ${groups.length}`);
    // Sort by similarity descending
    groups.sort((a, b) => b.similarity - a.similarity);
    this.duplicateGroups.set(groups);
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
    } else if (nameSim > 0.8) {
      // Log near-misses to help debug
      console.log(`[Dedup] Near miss: "${game1.name}" vs "${game2.name}" = ${nameSim} (threshold: ${this.nameSimilarityThreshold()})`);
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
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
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

    this.merging.set(true);
    this.gamesService.mergeGames(target.id, sourceIds).subscribe({
      next: () => {
        this.merging.set(false);
        this.cancelMerge();
        this.loadGames();
      },
      error: err => {
        console.error('Failed to merge games:', err);
        this.merging.set(false);
      }
    });
  }

  refreshDuplicates(): void {
    this.loadGames();
  }

  getMatchBadgeClass(reason: string): string {
    if (reason.includes('Steam')) return 'badge-steam';
    if (reason.includes('GoG')) return 'badge-gog';
    return 'badge-name';
  }
}

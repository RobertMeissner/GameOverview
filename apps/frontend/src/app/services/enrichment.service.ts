import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnrichmentBatchResult {
  enriched: number;
  unchanged: number;
  failed: number;
  details: GameEnrichmentDetail[];
  message: string;
}

export interface GameEnrichmentDetail {
  gameId: string;
  gameName: string;
  enriched: boolean;
  providersUsed: string[];
  message: string;
}

export interface GameEnrichmentResult {
  enriched: boolean;
  failed: boolean;
  providersUsed: string[];
  message: string;
}

export interface ProviderInfo {
  name: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EnrichmentService {
  private apiUrl = 'http://localhost:8080/enrichment';

  constructor(private http: HttpClient) {}

  /**
   * Enrich all games with data from all enabled providers
   */
  enrichAllGames(): Observable<EnrichmentBatchResult> {
    return this.http.post<EnrichmentBatchResult>(`${this.apiUrl}/enrich-all`, {});
  }

  /**
   * Enrich a single game with data from all enabled providers
   */
  enrichGame(gameId: string): Observable<GameEnrichmentResult> {
    return this.http.post<GameEnrichmentResult>(`${this.apiUrl}/enrich/${gameId}`, {});
  }

  /**
   * Get list of available enrichment providers and their status
   */
  getProviders(): Observable<ProviderInfo[]> {
    return this.http.get<ProviderInfo[]>(`${this.apiUrl}/providers`);
  }
}
